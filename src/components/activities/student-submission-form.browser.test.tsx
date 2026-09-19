import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { StudentSubmissionForm } from "./student-submission-form";
import type { StudentSubmission, SubmissionActionState } from "@/lib/submissions/types";

const draft: StudentSubmission = { id: "id", visibleFindings: "Saved findings", classification: "abnormal", relevantRegion: "Left lung", status: "draft", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", submittedAt: null };
const props = { submission: null, dueAt: null, deadlinePassed: false };
test("abnormal enables region; normal clears it", async () => {
  await render(<StudentSubmissionForm {...props} action={vi.fn()} />);
  const region = page.getByLabelText("Which region appears most relevant?");
  await expect.element(region).toBeDisabled();
  await page.getByRole("radio", { name: "Abnormal", exact: true }).click();
  await region.fill("Left lung");
  await page.getByRole("radio", { name: "Normal", exact: true }).click();
  await expect.element(region).toBeDisabled();
  await expect.element(region).toHaveValue("");
});
test("save keeps entered values, reports status, and disables pending controls", async () => {
  let finish!: (state: SubmissionActionState) => void;
  const action = vi.fn(() => new Promise<SubmissionActionState>(resolve => { finish = resolve; }));
  await render(<StudentSubmissionForm {...props} action={action} />);
  await page.getByLabelText("What visible findings do you observe?").fill("My findings");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  await expect.element(page.getByRole("status")).toHaveTextContent("Saving your response");
  expect(action.mock.calls[0]).toBeDefined();
  finish({ status: "draft_saved", message: "Draft saved. It has not been submitted." });
  await expect.element(page.getByRole("status")).toHaveTextContent("Draft saved");
  await expect.element(page.getByLabelText("What visible findings do you observe?")).toHaveValue("My findings");
});
test("final submission requires confirmation and becomes read only", async () => {
  const action = vi.fn(async (): Promise<SubmissionActionState> => ({ status: "submitted", message: "Final evaluation submitted." }));
  await render(<StudentSubmissionForm {...props} submission={draft} action={action} />);
  await page.getByRole("button", { name: "Submit final evaluation" }).click();
  expect(action).not.toHaveBeenCalled();
  await expect.element(page.getByText("Your final evaluation cannot be edited. Review your response before confirming.")).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await expect.element(page.getByRole("button", { name: "Confirm and submit" })).not.toBeInTheDocument();
  await page.getByRole("button", { name: "Submit final evaluation" }).click();
  await page.getByRole("button", { name: "Confirm and submit" }).click();
  await expect.element(page.getByRole("status")).toHaveTextContent("Final evaluation submitted");
  await expect.element(page.getByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
});
test.each(["unauthorized", "deadline_passed"] as const)("locks on %s server response", async status => {
  await render(<StudentSubmissionForm {...props} submission={draft} action={async () => ({ status, message: "Access closed" })} />);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("status")).toHaveTextContent(status === "deadline_passed" ? "Deadline passed" : "Access closed");
  await expect.element(page.getByRole("textbox")).not.toBeInTheDocument();
});
test("shows accessible field errors", async () => {
  await render(<StudentSubmissionForm {...props} action={async () => ({ status: "error", message: "Check fields", fieldErrors: { visibleFindings: "Enter a response" } })} />);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByLabelText("What visible findings do you observe?")).toHaveAttribute("aria-invalid", "true");
  await expect.element(page.getByRole("alert")).toHaveTextContent("Enter a response");
});
test("expired drafts are explicitly not submitted and read only", async () => {
  await render(<StudentSubmissionForm {...props} submission={draft} deadlinePassed action={vi.fn()} />);
  await expect.element(page.getByRole("status")).toHaveTextContent("Not submitted");
  await expect.element(page.getByText("Saved findings", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("textbox")).not.toBeInTheDocument();
});
test("submitted summary includes timestamp without controls", async () => {
  await render(<StudentSubmissionForm {...props} submission={{ ...draft, status: "submitted", submittedAt: "2026-01-01T00:00:00Z" }} action={vi.fn()} />);
  await expect.element(page.getByRole("status")).toHaveTextContent("permanently locked");
  await expect.element(page.getByRole("time")).toHaveAttribute("datetime", "2026-01-01T00:00:00Z");
  await expect.element(page.getByRole("button")).not.toBeInTheDocument();
});

test("an open saved draft becomes read only when its deadline passes", async () => {
  await render(<StudentSubmissionForm {...props} submission={draft} dueAt={new Date(Date.now() + 1500).toISOString()} action={async () => ({ status: "draft_saved", message: "Draft saved." })} />);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("status")).toHaveTextContent("Draft saved.");
  await expect.element(page.getByRole("status")).toHaveTextContent("Deadline passed");
  await expect.element(page.getByRole("textbox")).not.toBeInTheDocument();
});
