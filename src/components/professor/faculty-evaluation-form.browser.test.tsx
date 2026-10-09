import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { FacultyEvaluationForm } from "./faculty-evaluation-form";

test("labels the grading panel and saves a private review draft", async () => {
  const saveAction = async () => ({ status: "draft_saved" as const, message: "Draft saved. Students cannot see it." });
  const releaseAction = async () => ({ status: "released" as const, message: "Evaluation released. It can no longer be edited." });
  await render(<FacultyEvaluationForm evaluation={null} saveAction={saveAction} releaseAction={releaseAction} />);

  await expect.element(page.getByRole("heading", { name: "Grading" })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Save Review" })).toBeVisible();
  await page.getByLabelText("Score (%)").fill("85");
  await page.getByLabelText("Student feedback").fill("Clear interpretation.");
  await page.getByRole("button", { name: "Save Review" }).click();
  await expect.element(page.getByText("Draft saved. Students cannot see it.")).toBeVisible();
});

test("requires confirmation before release and locks after release", async () => {
  const saveAction = async () => ({ status: "draft_saved" as const, message: "Draft saved. Students cannot see it." });
  const releaseAction = async () => ({ status: "released" as const, message: "Evaluation released. It can no longer be edited." });
  await render(<FacultyEvaluationForm evaluation={null} saveAction={saveAction} releaseAction={releaseAction} />);

  await page.getByLabelText("Score (%)").fill("85");
  await page.getByLabelText("Student feedback").fill("Clear interpretation.");
  await page.getByRole("button", { name: "Release evaluation" }).click();
  await expect.element(page.getByText("Release is permanent. The score and feedback cannot be changed after release.")).toBeVisible();
  await page.getByRole("button", { name: "Confirm and release" }).click();
  await expect.element(page.getByText("Evaluation released. It can no longer be edited.")).toBeVisible();
  expect(document.querySelector('button[name="intent"][value="draft"]')).toBeNull();
});
