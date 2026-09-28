import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CaseUploadForm } from "./activity-forms";

vi.mock("@/app/(protected)/professor/activities/actions", () => ({
  archiveActivityAction: vi.fn(), confirmCaseUploadAction: vi.fn(), createActivityDraftAction: vi.fn(),
  deleteDraftActivityAction: vi.fn(), prepareCaseUploadAction: vi.fn(), publishActivityAction: vi.fn(), updateActivityAction: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

test("built-in case satisfies file selection while preserving professor attestation", async () => {
  await render(<CaseUploadForm activityId="test-activity" />);
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeDisabled();
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await expect.element(page.getByText("cxp-001.jpg", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeEnabled();
  const form = document.querySelector("form")!;
  expect(new FormData(form).get("mimeType")).toBe("image/jpeg");
  expect(Number(new FormData(form).get("byteSize"))).toBeGreaterThan(0);
  expect(form.checkValidity()).toBe(false);
  await page.getByRole("checkbox").click();
  expect(form.checkValidity()).toBe(true);
});
