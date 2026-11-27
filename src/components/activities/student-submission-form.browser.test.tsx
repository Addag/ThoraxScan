import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { StudentSubmissionForm } from "./student-submission-form";
import type { StudentSubmission, SubmissionActionState } from "@/lib/submissions/types";

// A 1x1 grey PNG stands in for the private case image.
const imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const draft: StudentSubmission = { id: "id", labels: ["Cardiomegaly", "Edema"], answers: { Edema: "Hazy lower zones" }, heatmap: null, status: "draft", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", submittedAt: null };
const props = { submission: null, imageUrl, heatmapRequired: true, dueAt: null, deadlinePassed: false };
const box = (name: string) => page.getByRole("checkbox", { name, exact: true });
/** Paints the outlined cell of the current finding with the keyboard, as a keyboard user would. */
function paintCurrent() {
  page.getByRole("application").element().dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
}

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
test("submitting needs a label, then a marked heatmap for every finding", async () => {
  const action = vi.fn();
  await render(<StudentSubmissionForm {...props} action={action} />);
  const submit = page.getByRole("button", { name: "Submit final evaluation" });
  await submit.click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("Select at least one label");
  await box("Edema").click();
  await box("Pneumonia").click();
  await submit.click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("Edema, Pneumonia");
  paintCurrent();
  await submit.click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("before submitting: Pneumonia.");
  await page.getByRole("combobox", { name: "Finding" }).selectOptions("Pneumonia");
  paintCurrent();
  await submit.click();
  await expect.element(page.getByRole("button", { name: "Confirm and submit" })).toBeVisible();
  expect(action).not.toHaveBeenCalled();
});
test("without per-finding maps in the key, a heatmap is not required", async () => {
  await render(<StudentSubmissionForm {...props} heatmapRequired={false} action={vi.fn()} />);
  await box("Edema").click();
  await page.getByRole("button", { name: "Submit final evaluation" }).click();
  await expect.element(page.getByRole("button", { name: "Confirm and submit" })).toBeVisible();
});
test("save sends labels, written answers and the painted map, and keeps them", async () => {
  let finish!: (state: SubmissionActionState) => void;
  const action = vi.fn<(previous: SubmissionActionState, data: FormData) => Promise<SubmissionActionState>>(() => new Promise(resolve => { finish = resolve; }));
  await render(<StudentSubmissionForm {...props} action={action} />);
  await box("Edema").click();
  await box("Fracture").click();
  await page.getByLabelText("What do you see for Edema?").fill("Hazy lower zones");
  paintCurrent();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  await expect.element(page.getByRole("status")).toHaveTextContent("Saving your response");
  const sent = action.mock.calls[0][1];
  expect(sent.getAll("labels")).toEqual(["Edema", "Fracture"]);
  expect(sent.get("answer:Edema")).toBe("Hazy lower zones");
  expect(sent.get("answer:Fracture")).toBe("");
  const map = JSON.parse(String(sent.get("heatmap"))) as number[];
  expect(map).toHaveLength(2744);
  // The default brush dab is centred on the first cell of Edema's slice (label index 5); nothing outside that slice is painted.
  expect(map[5 * 196]).toBe(1);
  expect(map.some((value, cell) => value > 0 && Math.floor(cell / 196) !== 5)).toBe(false);
  finish({ status: "draft_saved", message: "Draft saved. It has not been submitted." });
  await expect.element(page.getByRole("status")).toHaveTextContent("Draft saved");
  await expect.element(box("Edema")).toBeChecked();
  await expect.element(page.getByLabelText("What do you see for Edema?")).toHaveValue("Hazy lower zones");
});
test("final submission requires confirmation and becomes read only", async () => {
  const action = vi.fn(async (): Promise<SubmissionActionState> => ({ status: "submitted", message: "Final evaluation submitted." }));
  await render(<StudentSubmissionForm {...props} heatmapRequired={false} submission={draft} action={action} />);
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
test("shows accessible label and heatmap errors from the server", async () => {
  await render(<StudentSubmissionForm {...props} action={async () => ({ status: "error", message: "Check your answer.", fieldErrors: { labels: "Select at least one label.", heatmap: "Mark where each selected finding is." } })} />);
  await box("Edema").click();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("group", { name: "Which findings are present in this X-ray?" })).toHaveAttribute("aria-invalid", "true");
  await expect.element(page.getByText("Mark where each selected finding is.")).toBeVisible();
});
test("expired drafts are explicitly not submitted and read only", async () => {
  await render(<StudentSubmissionForm {...props} submission={draft} deadlinePassed action={vi.fn()} />);
  await expect.element(page.getByRole("status")).toHaveTextContent("Not submitted");
  await expect.element(page.getByText("Cardiomegaly", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("checkbox")).not.toBeInTheDocument();
});
test("submitted summary lists the labels with written answers and the timestamp, without controls", async () => {
  await render(<StudentSubmissionForm {...props} submission={{ ...draft, status: "submitted", submittedAt: "2026-01-01T00:00:00Z" }} action={vi.fn()} />);
  await expect.element(page.getByRole("status")).toHaveTextContent("permanently locked");
  await expect.element(page.getByRole("time")).toHaveAttribute("datetime", "2026-01-01T00:00:00Z");
  await expect.element(page.getByText("Hazy lower zones")).toBeVisible();
  await expect.element(page.getByText("No written answer")).toBeVisible();
  await expect.element(page.getByRole("button")).not.toBeInTheDocument();
});

test("an open saved draft becomes read only when its deadline passes", async () => {
  await render(<StudentSubmissionForm {...props} submission={draft} dueAt={new Date(Date.now() + 1500).toISOString()} action={async () => ({ status: "draft_saved", message: "Draft saved." })} />);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.element(page.getByRole("status")).toHaveTextContent("Draft saved.");
  await expect.element(page.getByRole("status")).toHaveTextContent("Deadline passed");
  await expect.element(page.getByRole("checkbox")).not.toBeInTheDocument();
});
