import { beforeEach, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { LearningModeAnalyzer } from "./learning-mode-analyzer";
import { InferenceError, type InferenceErrorCode } from "@/lib/inference/errors";
import type { InferenceResult } from "@/lib/inference/runtime";
import { createTestManifest } from "@/lib/inference/test-manifest";
import { postprocessLogits } from "@/lib/inference/postprocess";
import "@/app/globals.css";

const mocks = vi.hoisted(() => ({ analyze: vi.fn() }));
vi.mock("@/lib/inference/runtime", () => ({ analyzeImage: mocks.analyze }));
const manifest = createTestManifest();
function prediction(logits = manifest.labels.map((_, index) => index === 2 ? 2 : -2)): InferenceResult {
  return { ...postprocessLogits(logits, manifest), releaseId: "test-release", modelReleaseId: 1,
    modelSha256: "a".repeat(64), bundleSha256: "b".repeat(64), preprocessingVersion: "preprocessing-v1",
    thresholdVersion: "thresholds-v1", manifestVersion: 1, executionProvider: "wasm", applicationBuild: "test-build" };
}
async function select(file = new File([new Uint8Array([1])], "practice.png", { type: "image/png" })) {
  await page.getByLabelText("Image file", { exact: true }).upload(file);
}
async function start() { await select(); await page.getByRole("button", { name: "Analyze", exact: true }).click(); }
beforeEach(() => { mocks.analyze.mockReset(); mocks.analyze.mockResolvedValue(prediction()); });

test("built-in case loads real JPEG bytes and can be analyzed and reset", async () => {
  await render(<LearningModeAnalyzer />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await expect.element(page.getByAltText("Selected chest X-ray preview")).toHaveAttribute("src", expect.stringMatching(/^blob:/));
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect.poll(() => mocks.analyze.mock.calls.length).toBe(1);
  const file = mocks.analyze.mock.calls[0][0] as File;
  expect(file.name).toBe("cxp-001.jpg");
  expect(file.type).toBe("image/jpeg");
  expect(Array.from(new Uint8Array(await file.arrayBuffer()).slice(0, 2))).toEqual([255, 216]);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeDisabled();
});

test("library filters by a positive dataset label", async () => {
  await render(<LearningModeAnalyzer />);
  await page.getByLabelText("Filter by view").selectOptions("Frontal");
  await page.getByLabelText("Filter by dataset label").selectOptions("Lung Lesion");
  expect(document.querySelectorAll("article").length).toBe(1);
  await page.getByText("Dataset reference labels", { exact: true }).click();
  expect(document.querySelector("article details p")?.textContent).toContain("Lung Lesion");
});

test("library includes lateral cases with accurate view labels", async () => {
  await render(<LearningModeAnalyzer />);
  await page.getByLabelText("Filter by view").selectOptions("Lateral");
  expect(document.querySelectorAll("article").length).toBe(32);
  for (const card of document.querySelectorAll("article")) {
    expect(card.querySelector("img")?.getAttribute("alt")).toContain("Lateral");
  }
});

test("valid selection previews locally and enables analysis only after selection", async () => {
  await render(<LearningModeAnalyzer />);
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeDisabled();
  await select();
  await expect.element(page.getByAltText("Selected chest X-ray preview")).toHaveAttribute("src", expect.stringMatching(/^blob:/));
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeEnabled();
  expect(mocks.analyze).not.toHaveBeenCalled();
});

function drop(file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  page.getByRole("button", { name: "Choose or drop a chest X-ray image", exact: true }).element()
    .dispatchEvent(new DragEvent("drop", { dataTransfer, bubbles: true, cancelable: true }));
}

test("dropped image previews and enables analysis; invalid drop is rejected", async () => {
  await render(<LearningModeAnalyzer />);
  drop(new File([new Uint8Array([1])], "drop.gif", { type: "image/gif" }));
  await expect.element(page.getByRole("alert")).toHaveTextContent("Only JPEG and PNG images are supported.");
  drop(new File([new Uint8Array([1])], "drop.png", { type: "image/png" }));
  await expect.element(page.getByAltText("Selected chest X-ray preview")).toHaveAttribute("src", expect.stringMatching(/^blob:/));
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeEnabled();
  await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
});

test.each([
  ["image/gif", 1, "Only JPEG and PNG images are supported."],
  ["image/png", 0, "The selected image is empty."],
  ["image/jpeg", 6 * 1024 * 1024 + 1, "Images must be 6 MiB or smaller."],
])("rejects invalid file %s (%i bytes)", async (type, size, copy) => {
  await render(<LearningModeAnalyzer />);
  await select(new File([new Uint8Array(size)], "input", { type }));
  await expect.element(page.getByRole("alert")).toHaveTextContent(copy);
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeDisabled();
  expect(mocks.analyze).not.toHaveBeenCalled();
});

test("accepts the exact 6 MiB boundary", async () => {
  await render(<LearningModeAnalyzer />);
  await select(new File([new Uint8Array(6 * 1024 * 1024)], "input.jpg", { type: "image/jpeg" }));
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeEnabled();
});

test("reset aborts the run and ignores a stale completion", async () => {
  let finish!: (result: InferenceResult) => void;
  mocks.analyze.mockImplementation(() => new Promise<InferenceResult>((resolve) => { finish = resolve; }));
  await render(<LearningModeAnalyzer />);
  await start();
  await expect.element(page.getByText("Analyzing in this browser…")).toBeVisible();
  await expect.poll(() => mocks.analyze.mock.calls.length).toBe(1);
  const signal = mocks.analyze.mock.calls[0][1].signal as AbortSignal;
  await page.getByRole("button", { name: "Reset" }).click();
  expect(signal.aborted).toBe(true);
  finish(prediction());
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeDisabled();
  await expect.element(page.getByRole("heading", { name: "Analysis result" })).not.toBeInTheDocument();
  await expect.element(page.getByAltText("Selected chest X-ray preview")).not.toBeInTheDocument();
});

test("findings, contract order, focus, and provenance", async () => {
  await render(<LearningModeAnalyzer />);
  await start();
  await expect.element(page.getByRole("heading", { name: "Analysis result" })).toHaveFocus();
  await expect.element(page.getByText("Cardiomegaly", { exact: true }).first()).toBeVisible();
  await page.getByText("All 14 labels", { exact: true }).click();
  const labels = page.getByText("All 14 labels", { exact: true }).element().closest("details")!;
  expect(Array.from(labels.querySelectorAll("li strong"), (node) => node.textContent)).toEqual(manifest.labels.map((item) => item.name));
  await page.getByText("Release and execution provenance", { exact: true }).click();
  for (const value of ["test-release", "WASM", "preprocessing-v1", "thresholds-v1", "test-build", "a".repeat(64), "b".repeat(64)]) {
    await expect.element(page.getByText(value, { exact: true })).toBeVisible();
  }
  expect(page.getByText("Release and execution provenance", { exact: true }).element().closest("details")?.textContent).toContain("Manifest version1");
});

test("no label meets threshold", async () => {
  mocks.analyze.mockResolvedValue(prediction(manifest.labels.map(() => -2)));
  await render(<LearningModeAnalyzer />); await start();
  await expect.element(page.getByText("No finding met its configured threshold.")).toBeVisible();
});

test("No Finding suppression uses postprocessing output", async () => {
  mocks.analyze.mockResolvedValue(prediction(manifest.labels.map((_, i) => i < 2 ? 2 : -2)));
  await render(<LearningModeAnalyzer />); await start();
  await expect.element(page.getByText("No Finding: Suppressed by abnormal finding.")).toBeVisible();
  expect(page.getByRole("region", { name: "Likely findings" }).element().textContent).not.toContain("No Finding");
  await page.getByText("All 14 labels", { exact: true }).click();
  await expect.element(page.getByText("Likely · Suppressed by abnormal finding", { exact: true })).toBeVisible();
});

test("possible tier lists borderline findings only when the release defines it", async () => {
  // Logit 0 -> probability 0.5: below the 0.6 threshold, above the 0.3 possible threshold.
  const tiered = { ...manifest, labels: manifest.labels.map((item) => ({ ...item, threshold: 0.6, possibleThreshold: 0.3 })) };
  const logits = manifest.labels.map((_, i) => (i === 2 ? 2 : i === 5 ? 0 : -4));
  mocks.analyze.mockResolvedValue({ ...prediction(), ...postprocessLogits(logits, tiered) });
  await render(<LearningModeAnalyzer />); await start();
  expect(page.getByRole("region", { name: "Likely findings" }).element().textContent).toContain("Cardiomegaly");
  const possible = page.getByRole("region", { name: "Possible findings" }).element().textContent;
  expect(possible).toContain("Edema");
  expect(possible).not.toContain("Cardiomegaly");
});

test("possible tier is hidden for releases without possible thresholds", async () => {
  await render(<LearningModeAnalyzer />); await start();
  await expect.element(page.getByRole("heading", { name: "Analysis result" })).toBeVisible();
  await expect.element(page.getByRole("region", { name: "Possible findings" })).not.toBeInTheDocument();
});

const errorCodes: InferenceErrorCode[] = ["NO_ACTIVE_MODEL", "UNSUPPORTED_MANIFEST", "ARTIFACT_INTEGRITY_FAILED", "PREPROCESSING_FAILED", "MODEL_LOAD_FAILED", "INVALID_OUTPUT"];
test.each(errorCodes)("safe error and retry for %s", async (code) => {
  mocks.analyze.mockRejectedValue(new InferenceError(code, "private internal diagnostic"));
  await render(<LearningModeAnalyzer />); await start();
  await expect.element(page.getByRole("alert")).toBeVisible();
  expect(document.body.textContent).not.toContain("private internal diagnostic");
  await expect.element(page.getByRole("button", { name: "Analyze", exact: true })).toBeEnabled();
});

test("AbortError does not appear as a failure", async () => {
  mocks.analyze.mockRejectedValue(new DOMException("aborted", "AbortError"));
  await render(<LearningModeAnalyzer />); await start();
  await expect.element(page.getByText("Image ready to analyze.")).toBeVisible();
  await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
});

test.each(["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"])("serves matching ORT asset %s", async (asset) => {
  const response = await fetch(`/ort/1.27.0/${asset}`);
  expect(response.status).toBe(200);
  expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
});
