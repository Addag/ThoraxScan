import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ComponentProps } from "react";
import { ActivityAIFeedback } from "./activity-ai-feedback";
import { ACTIVITY_AI_LABELS, type ActivityAIFeedback as Feedback } from "@/lib/activity-ai/types";

// These component tests run without Next.js's router or build-time environment.
import "@/app/globals.css";

vi.mock("next/link", () => ({ __esModule: true, default: (props: ComponentProps<"a">) => <a {...props} /> }));

const labels = ACTIVITY_AI_LABELS.map((label) => ({
  label, threshold: 0.5,
  probability: label === "Cardiomegaly" ? 0.8 : 0.1,
  predicted: label === "Cardiomegaly", possible: false,
}));
// The AI found Cardiomegaly; the Professor added Edema.
const initial: Feedback = {
  status: "ready", attemptCount: 1, safeErrorCode: null, attemptedAt: null, completedAt: null,
  result: {
    state: "predicted", labels, findings: labels.filter((item) => item.predicted), possibleFindings: [],
    provenance: { releaseId: "r", modelSha256: "m", bundleSha256: "b", manifestVersion: 1, preprocessingVersion: "p", thresholdVersion: "t", executionProvider: "wasm", applicationBuild: "a" },
    attention: { status: "unavailable", reason: "legacy-model-release" }, attentionStatus: "unavailable",
    validatedLabels: ["Cardiomegaly", "Edema"],
  },
};
const answer = { selected: ["Cardiomegaly", "Fracture"], labelScore: 33.33 };

test("compares the Student's labels with the Professor-validated key", async () => {
  await render(<ActivityAIFeedback imageUrl={null} initial={initial} {...answer} />);
  await expect.element(page.getByRole("region", { name: "Label score" })).toHaveTextContent("33.33%");
  const key = page.getByRole("region", { name: "Correct labels" });
  await expect.element(key).toHaveTextContent("Cardiomegaly · You selected thisAI found");
  await expect.element(key).toHaveTextContent("Edema · You missed thisAdded by Professor");
  await expect.element(key).toHaveTextContent("Fracture · You selected this, but it is not present");
});

test("reopening a finished activity does not pop the result up", async () => {
  await render(<ActivityAIFeedback imageUrl={null} initial={initial} {...answer} />);
  await expect.element(page.getByRole("button", { name: "Close result" })).not.toBeInTheDocument();
  await expect.element(page.getByRole("region", { name: "Correct labels" })).toBeVisible();
});

test("results that become ready during the visit pop up, then stay on the page", async () => {
  const screen = await render(<ActivityAIFeedback imageUrl={null} initial={{ ...initial, status: "locked", result: null }} {...answer} />);
  await expect.element(page.getByText("Submit your final evaluation", { exact: false })).toBeVisible();
  await screen.rerender(<ActivityAIFeedback imageUrl={null} initial={initial} {...answer} />);
  const dialog = page.getByRole("dialog", { name: "Results" }).element() as HTMLDialogElement;
  expect(dialog.open).toBe(true);
  await page.getByRole("button", { name: "Close result" }).click();
  expect(dialog.open).toBe(false);
  await expect.element(page.getByRole("region", { name: "Correct labels" })).toHaveTextContent("Cardiomegaly");
});

test("an activity without an answer key explains that it has no results", async () => {
  await render(<ActivityAIFeedback imageUrl={null} initial={{ ...initial, result: { ...initial.result!, validatedLabels: null } }} {...answer} />);
  await expect.element(page.getByText("published before answer keys existed", { exact: false })).toBeVisible();
});
