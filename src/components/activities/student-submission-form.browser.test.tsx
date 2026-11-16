import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { StudentSubmissionForm } from "./student-submission-form";
import type { StudentSubmission, SubmissionActionState } from "@/lib/submissions/types";

const draft: StudentSubmission = { id: "id", labels: ["Cardiomegaly", "Edema"], labelScore: null, status: "draft", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", submittedAt: null };
const props = { submission: null, dueAt: null, deadlinePassed: false };
const box = (name: string) => page.getByRole("checkbox", { name, exact: true });

test("No Finding stands alone", async () => {
  await render(<StudentSubmissionForm {...props} action={vi.fn()} />);
  await box("Edema").click();
  await box("Pneumonia").click();
  await box("No Finding").click();
  await expect.element(box("Edema")).not.toBeChecked();
  await expect.element(box("Pneumonia")).not.toBeChecked();
  await box("Edema").click();
  await expect.element(box("No Finding")).not.toBeChecked();
  await expect.element(box("Edema")).toBeChecked();
});
test("submitting without a label prompts instead of confirming", async () => {
  const action = vi.fn();
  await render(<StudentSubmissionForm {...props} action={action} />);
  const submit = page.getByRole("button", { name: "Submit final evaluation" });
  const prompt = page.getByText("Select at least one label before submitting.");
  await submit.click();
  await expect.element(prompt).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Confirm and submit" })).not.toBeInTheDocument();
  await box("No Finding").click();
  await expect.element(prompt).not.toBeInTheDocument();
  await submit.click();
  await expect.element(page.getByRole("button", { name: "Confirm and submit" })).toBeVisible();
  expect(action).not.toHaveBeenCalled();
});
test("save sends the ticked labels, reports status, and disables pending controls", async () => {
  let finish!: (state: SubmissionActionState) => void;
  const action = vi.fn<(previous: SubmissionActionState, data: FormData) => Promise<SubmissionActionState>>(() => new Promise(resolve => { finish = resolve; }));
  await render(<StudentSubmissionForm {...props} action={action} />);
  await box("Edema").click();
  await box("Fracture").click();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  await expect.element(page.getByRole("status")).toHaveTextContent("Saving your response");
  expect(action.mock.calls[0][1].getAll("labels")).toEqual(["Edema", "Fracture"]);
  finish({ status: "draft_saved", message: "Draft saved. It has not been submitted." });
  await expect.element(page.getByRole("status")).toHaveTextContent("Draft saved");
  await expect.element(box("Edema")).toBeChecked();
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
  await expect.element(page.getByRole("checkbox")).not.toBeInTheDocument();
});
test("shows an accessible label error", async () => {
  await render(<StudentSubmissionForm {...props} action={async () => ({ status: "error", message: "Check your selected labels.", fieldErrors: { labels: "Select at least one label." } })} />);
  await box("Edema").click();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("group", { name: "Which findings are present in this X-ray?" })).toHaveAttribute("aria-invalid", "true");
  await expect.element(page.getByRole("alert")).toHaveTextContent("Select at least one label.");
});
test("expired drafts are explicitly not submitted and read only", async () => {
  await render(<StudentSubmissionForm {...props} submission={draft} deadlinePassed action={vi.fn()} />);
  await expect.element(page.getByRole("status")).toHaveTextContent("Not submitted");
  await expect.element(page.getByText("Cardiomegaly", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("checkbox")).not.toBeInTheDocument();
});
test("submitted summary lists the labels and timestamp without controls", async () => {
  await render(<StudentSubmissionForm {...props} submission={{ ...draft, labelScore: 100, status: "submitted", submittedAt: "2026-01-01T00:00:00Z" }} action={vi.fn()} />);
  await expect.element(page.getByRole("status")).toHaveTextContent("permanently locked");
  await expect.element(page.getByRole("time")).toHaveAttribute("datetime", "2026-01-01T00:00:00Z");
  await expect.element(page.getByText("Edema", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button")).not.toBeInTheDocument();
});

test("an open saved draft becomes read only when its deadline passes", async () => {
  await render(<StudentSubmissionForm {...props} submission={draft} dueAt={new Date(Date.now() + 1500).toISOString()} action={async () => ({ status: "draft_saved", message: "Draft saved." })} />);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("status")).toHaveTextContent("Draft saved.");
  await expect.element(page.getByRole("status")).toHaveTextContent("Deadline passed");
  await expect.element(page.getByRole("checkbox")).not.toBeInTheDocument();
});
