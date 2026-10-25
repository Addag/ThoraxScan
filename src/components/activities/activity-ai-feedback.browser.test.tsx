import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ComponentProps } from "react";
import { ActivityAIFeedback } from "./activity-ai-feedback";
import { ACTIVITY_AI_LABELS, type ActivityAIFeedback as Feedback } from "@/lib/activity-ai/types";

// These component tests run without Next.js's router or build-time environment.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/link", () => ({ __esModule: true, default: (props: ComponentProps<"a">) => <a {...props} /> }));
vi.mock("@/lib/activity-ai/actions", () => ({ claimActivityAIAnalysis: vi.fn(), completeActivityAIAnalysis: vi.fn(), failActivityAIAnalysis: vi.fn(), refreshActivityCaseUrl: vi.fn() }));

const labels = ACTIVITY_AI_LABELS.map((label) => ({
  label, threshold: 0.5,
  probability: label === "Cardiomegaly" ? 0.8 : label === "Edema" ? 0.4 : 0.1,
  predicted: label === "Cardiomegaly", possible: label === "Edema",
}));
const initial: Feedback = {
  status: "ready", attemptCount: 1, safeErrorCode: null, attemptedAt: null, completedAt: null,
  result: {
    state: "predicted", labels, findings: labels.filter((item) => item.predicted), possibleFindings: labels.filter((item) => item.possible),
    provenance: { releaseId: "r", modelSha256: "m", bundleSha256: "b", manifestVersion: 1, preprocessingVersion: "p", thresholdVersion: "t", executionProvider: "wasm", applicationBuild: "a" },
    attention: { status: "unavailable", reason: "legacy-model-release" }, attentionStatus: "unavailable",
  },
};

test("shows likely, possible, and all labels like Learning Mode", async () => {
  await render(<ActivityAIFeedback activityId="a" imageUrl={null} initial={initial} />);
  await expect.element(page.getByRole("region", { name: "Likely findings" })).toHaveTextContent("Cardiomegaly");
  await expect.element(page.getByRole("region", { name: "Possible findings" })).toHaveTextContent("Edema");
  await page.getByText("All 14 labels", { exact: true }).click();
  const list = page.getByText("All 14 labels", { exact: true }).element().closest("details")!.textContent;
  expect(list).toContain("Likely");
  expect(list).toContain("Possible");
  expect(list).toContain("Not matched");
});
