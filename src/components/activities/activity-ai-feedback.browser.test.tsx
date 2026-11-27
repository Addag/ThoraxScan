import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ComponentProps } from "react";
import { ActivityAIFeedback } from "./activity-ai-feedback";
import { ACTIVITY_AI_LABELS, type ActivityAIFeedback as Feedback } from "@/lib/activity-ai/types";
import { readyClassActivation } from "@/lib/inference/attention";
import type { StudentSubmission } from "@/lib/submissions/types";

// These component tests run without Next.js's router or build-time environment.
import "@/app/globals.css";

vi.mock("next/link", () => ({ __esModule: true, default: (props: ComponentProps<"a">) => <a {...props} /> }));

const imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const labels = ACTIVITY_AI_LABELS.map((label) => ({
  label, threshold: 0.5,
  probability: label === "Cardiomegaly" ? 0.8 : 0.1,
  predicted: label === "Cardiomegaly", possible: false,
}));
// The AI found Cardiomegaly; the Professor added Edema. Every validated map is fully marked.
const initial: Feedback = {
  status: "ready", attemptCount: 1, safeErrorCode: null, attemptedAt: null, completedAt: null,
  result: {
    state: "predicted", labels, findings: labels.filter((item) => item.predicted), possibleFindings: [],
    provenance: { releaseId: "r", modelSha256: "m", bundleSha256: "b", manifestVersion: 3, preprocessingVersion: "p", thresholdVersion: "t", executionProvider: "wasm", applicationBuild: "a" },
    attention: readyClassActivation(Array(2744).fill(1)), attentionStatus: "ready",
    validatedLabels: ["Cardiomegaly", "Edema"],
  },
};
// The Student marked Cardiomegaly (label index 2) and selected Fracture by mistake.
const studentMap = Array.from({ length: 2744 }, (_, cell) => Math.floor(cell / 196) === 2 ? 1 : 0);
const submission: StudentSubmission = {
  id: "s", labels: ["Cardiomegaly", "Fracture"], answers: { Cardiomegaly: "Heart looks wide" }, heatmap: studentMap,
  status: "submitted", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", submittedAt: "2026-01-01T00:00:00Z",
};

test("compares the Student's labels and answers with the key, without a score", async () => {
  await render(<ActivityAIFeedback imageUrl={imageUrl} initial={initial} submission={submission} />);
  const key = page.getByRole("region", { name: "Correct labels" });
  await expect.element(key).toHaveTextContent("Cardiomegaly · You selected this");
  await expect.element(key).toHaveTextContent("Your answer: Heart looks wide");
  await expect.element(key).toHaveTextContent("Edema · You missed thisAdded by Professor");
  await expect.element(key).toHaveTextContent("Fracture · You selected this, but it is not present");
  await expect.element(key).toHaveTextContent("Your Professor grades your answer separately.");
  await expect.element(page.getByText("Label score")).not.toBeInTheDocument();
});

test("shows the Student's heatmap next to the validated one", async () => {
  await render(<ActivityAIFeedback imageUrl={imageUrl} initial={initial} submission={submission} />);
  const comparison = page.getByRole("region", { name: "Heatmaps side by side" });
  await expect.element(comparison.getByText("Your heatmap")).toBeVisible();
  await expect.element(comparison.getByText("Professor-validated heatmap")).toBeVisible();
  await expect.element(comparison.getByRole("combobox", { name: "Finding" })).toHaveValue("Cardiomegaly");
  await comparison.getByRole("combobox", { name: "Finding" }).selectOptions("Edema");
  await expect.element(comparison.getByText("This finding was not selected.")).toBeVisible();
});

test("results that become ready during the visit pop up, then stay on the page", async () => {
  const screen = await render(<ActivityAIFeedback imageUrl={imageUrl} initial={{ ...initial, status: "locked", result: null }} submission={submission} />);
  await expect.element(page.getByText("Submit your final evaluation", { exact: false })).toBeVisible();
  await screen.rerender(<ActivityAIFeedback imageUrl={imageUrl} initial={initial} submission={submission} />);
  const dialog = page.getByRole("dialog", { name: "Results" }).element() as HTMLDialogElement;
  expect(dialog.open).toBe(true);
  await page.getByRole("button", { name: "Close result" }).click();
  expect(dialog.open).toBe(false);
  await expect.element(page.getByRole("region", { name: "Correct labels" })).toHaveTextContent("Cardiomegaly");
});

test("an activity without an answer key explains that it has no results", async () => {
  await render(<ActivityAIFeedback imageUrl={imageUrl} initial={{ ...initial, result: { ...initial.result!, validatedLabels: null } }} submission={submission} />);
  await expect.element(page.getByText("published before answer keys existed", { exact: false })).toBeVisible();
});
