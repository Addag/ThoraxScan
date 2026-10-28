import { beforeEach, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CaseUploadForm } from "./activity-forms";
import { XrayLibrary } from "../learning/xray-library";
import { initialCaseUploadFormState, type CaseRemovalFormState } from "@/lib/activities/types";

const mocks = vi.hoisted(() => ({ remove: vi.fn(), prepare: vi.fn(), upload: vi.fn(), confirm: vi.fn() }));

vi.mock("@/app/(protected)/professor/activities/actions", () => ({
  archiveActivityAction: vi.fn(), confirmCaseUploadAction: mocks.confirm, createActivityDraftAction: vi.fn(),
  deleteDraftActivityAction: vi.fn(), prepareCaseUploadAction: mocks.prepare, publishActivityAction: vi.fn(), updateActivityAction: vi.fn(),
  removeActivityCaseAction: mocks.remove,
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ storage: { from: () => ({ uploadToSignedUrl: mocks.upload }) } }) }));

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.remove.mockReset().mockResolvedValue({ status: "success", message: "Case image removed.", removedCaseId: "attached-case" });
  mocks.prepare.mockReset().mockResolvedValue({ status: "error", message: "Check the case image.", fieldErrors: { file: "Choose another image." } });
  mocks.upload.mockReset().mockResolvedValue({ error: null });
  mocks.confirm.mockReset().mockResolvedValue({ status: "success", message: "Case image uploaded and verified." });
});

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

test("clearing a library case resets selection, attestation, metadata, and validation", async () => {
  await render(<CaseUploadForm activityId="test-activity" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Upload and verify case" }).click();
  await expect.element(page.getByText("Choose another image.")).toBeVisible();
  await page.getByRole("button", { name: "Remove selected case" }).click();
  await expect.element(page.getByText("Choose a chest X-ray", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeDisabled();
  await expect.element(page.getByRole("checkbox")).not.toBeChecked();
  await expect.element(page.getByText("Case 01 loaded.")).not.toBeInTheDocument();
  await expect.element(page.getByText("Choose another image.")).not.toBeInTheDocument();
  await expect.element(page.getByText("Check the case image.")).not.toBeInTheDocument();
  await expect.element(page.getByText("Selected case removed.")).toBeVisible();
  const form = document.querySelector("form")!;
  expect(new FormData(form).get("mimeType")).toBe("");
  expect(new FormData(form).get("byteSize")).toBe("");
  expect(form.checkValidity()).toBe(false);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await expect.element(page.getByText("cxp-001.jpg", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeEnabled();
  await expect.element(page.getByText("Selected case removed.")).not.toBeInTheDocument();
  expect(mocks.remove).not.toHaveBeenCalled();
});

test("clears a local file input and allows selecting the same file again", async () => {
  await render(<CaseUploadForm activityId="test-activity" />);
  const file = new File(["image"], "local-case.png", { type: "image/png" });
  await page.getByLabelText("Choose a chest X-ray file").upload(file);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Remove selected case" }).click();
  expect(document.querySelector<HTMLInputElement>('input[type="file"]')!.value).toBe("");
  expect(document.querySelector<HTMLInputElement>('input[type="file"]')!.files).toHaveLength(0);
  await expect.element(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByLabelText("Choose a chest X-ray file").upload(file);
  await expect.element(page.getByText("local-case.png", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeEnabled();
});

test("local file selection clears the controlled library status", async () => {
  await render(<CaseUploadForm activityId="test-activity" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await expect.element(page.getByText("Case 01 loaded.")).toBeVisible();
  await page.getByLabelText("Choose a chest X-ray file").upload(new File(["image"], "local-case.png", { type: "image/png" }));
  await expect.element(page.getByText("Case 01 loaded.")).not.toBeInTheDocument();
});

test("uncontrolled library callers still announce their selection", async () => {
  const select = vi.fn();
  await render(<XrayLibrary onSelect={select} />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await expect.element(page.getByText("Case 01 loaded.")).toBeVisible();
  expect(select).toHaveBeenCalledWith(expect.any(File), "cxp-001");
});

test("activity library offers frontal cases only", async () => {
  await render(<XrayLibrary frontalOnly onSelect={vi.fn()} />);
  await expect.element(page.getByText("202 of 202 cases")).toBeVisible();
  await expect.element(page.getByLabelText("Filter by view")).not.toBeInTheDocument();
  await expect.element(page.getByRole("button", { name: "Use case 03", exact: true })).not.toBeInTheDocument();
});

test("canceling uploaded-case removal leaves the case and selection intact", async () => {
  await render(<CaseUploadForm activityId="test-activity" caseId="attached-case" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("button", { name: "Remove uploaded case" }).click();
  await expect.element(page.getByRole("dialog", { name: "Remove case image?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  expect(mocks.remove).not.toHaveBeenCalled();
  await expect.element(page.getByText("cxp-001.jpg", { exact: true })).toBeVisible();
});

test("removal locks uploads until completion, resets selection, and permits replacement", async () => {
  let finish!: (state: CaseRemovalFormState) => void;
  mocks.remove.mockImplementation(() => new Promise<CaseRemovalFormState>((resolve) => { finish = resolve; }));
  await render(<CaseUploadForm activityId="test-activity" caseId="attached-case" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("button", { name: "Remove uploaded case" }).click();
  await page.getByRole("button", { name: "Remove image" }).click();
  await expect.element(page.getByRole("button", { name: "Removing…" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Use case 01", exact: true })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove selected case" })).toBeDisabled();
  await expect.element(page.getByLabelText("Choose a chest X-ray file")).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeDisabled();
  expect((mocks.remove.mock.calls[0][1] as FormData).get("caseId")).toBe("attached-case");
  finish({ status: "success", message: "Case image removed.", removedCaseId: "attached-case" });
  await expect.element(page.getByText("Case image removed.")).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).not.toBeInTheDocument();
  await expect.element(page.getByRole("button", { name: "Upload and verify case" })).toBeDisabled();
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("checkbox").click();
  mocks.prepare.mockResolvedValue({ status: "prepared", message: "Uploading…", activityId: "test-activity", caseId: "replacement-case", path: "replacement", token: "signed-token", expectedMimeType: "image/jpeg" });
  await page.getByRole("button", { name: "Upload and verify case" }).click();
  await expect.element(page.getByText("Case image uploaded and verified.")).toBeVisible();
  expect(mocks.upload).toHaveBeenCalled();
  expect(mocks.confirm).toHaveBeenCalled();
});

test("cleanup retries keep their case ID after the attached-case prop is cleared", async () => {
  mocks.remove.mockResolvedValueOnce({ status: "cleanup_pending", message: "Image cleanup failed. Retry cleanup.", removedCaseId: "attached-case", cleanupCaseId: "attached-case" });
  const view = await render(<CaseUploadForm activityId="test-activity" caseId="attached-case" />);
  await page.getByRole("button", { name: "Remove uploaded case" }).click();
  await page.getByRole("button", { name: "Remove image" }).click();
  await expect.element(page.getByRole("button", { name: "Retry cleanup" })).toBeVisible();
  await view.rerender(<CaseUploadForm activityId="test-activity" caseId={null} />);
  await page.getByRole("button", { name: "Use case 02", exact: true }).click();
  await page.getByRole("button", { name: "Retry cleanup" }).click();
  await expect.element(page.getByText("Case image removed.")).toBeVisible();
  await expect.element(page.getByText("cxp-002.jpg", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  expect(mocks.remove.mock.calls[1][0].cleanupCaseId).toBe("attached-case");
  expect((mocks.remove.mock.calls[1][1] as FormData).get("caseId")).toBe("attached-case");
});

test("upload authorization disables case removal", async () => {
  let finish!: (state: typeof initialCaseUploadFormState) => void;
  mocks.prepare.mockImplementation(() => new Promise<typeof initialCaseUploadFormState>((resolve) => { finish = resolve; }));
  await render(<CaseUploadForm activityId="test-activity" caseId="attached-case" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Upload and verify case" }).click();
  await expect.element(page.getByRole("button", { name: "Authorizing…" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove selected case" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeDisabled();
  finish({ status: "error", message: "Authorization failed." });
  await expect.element(page.getByText("Authorization failed.")).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeEnabled();
});

test("library loading locks selection and uploaded-case removal", async () => {
  await render(<CaseUploadForm activityId="test-activity" caseId="attached-case" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  let finish!: (response: Response) => void;
  vi.spyOn(window, "fetch").mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
  await page.getByRole("button", { name: "Use case 02", exact: true }).click();
  await expect.element(page.getByText("Loading library image…")).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Remove selected case" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeDisabled();
  await expect.element(page.getByLabelText("Choose a chest X-ray file")).toBeDisabled();
  finish(new Response(new Blob(["image"], { type: "image/jpeg" })));
  await expect.element(page.getByText("cxp-002.jpg", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeEnabled();
});

test("direct upload and confirmation keep removal disabled", async () => {
  let finishUpload!: (result: { error: null }) => void;
  let finishConfirmation!: (state: typeof initialCaseUploadFormState) => void;
  mocks.prepare.mockResolvedValue({ status: "prepared", message: "Uploading…", activityId: "test-activity", caseId: "new-case", path: "new", token: "signed-token", expectedMimeType: "image/jpeg" });
  mocks.upload.mockImplementation(() => new Promise<{ error: null }>((resolve) => { finishUpload = resolve; }));
  mocks.confirm.mockImplementation(() => new Promise<typeof initialCaseUploadFormState>((resolve) => { finishConfirmation = resolve; }));
  await render(<CaseUploadForm activityId="test-activity" caseId="attached-case" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Upload and verify case" }).click();
  await expect.element(page.getByRole("button", { name: "Uploading directly…" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove selected case" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeDisabled();
  finishUpload({ error: null });
  await expect.element(page.getByRole("button", { name: "Verifying…" })).toBeDisabled();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeDisabled();
  finishConfirmation({ status: "success", message: "Case image uploaded and verified." });
  await expect.element(page.getByText("Case image uploaded and verified.")).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeEnabled();
});

test("a failed new upload exposes removal of its reservation without a reload", async () => {
  mocks.prepare.mockResolvedValue({ status: "prepared", message: "Uploading…", activityId: "test-activity", caseId: "reserved-case", path: "reserved", token: "signed-token", expectedMimeType: "image/jpeg" });
  mocks.upload.mockResolvedValue({ error: new Error("upload failed") });
  mocks.remove.mockResolvedValue({ status: "success", message: "Case image removed.", removedCaseId: "reserved-case" });
  await render(<CaseUploadForm activityId="test-activity" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Upload and verify case" }).click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("The direct upload failed.");
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).toBeEnabled();
  await page.getByRole("button", { name: "Remove selected case" }).click();
  await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
  await page.getByRole("button", { name: "Remove uploaded case" }).click();
  await page.getByRole("button", { name: "Remove image" }).click();
  await expect.element(page.getByText("Case image removed.")).toBeVisible();
  expect((mocks.remove.mock.calls[0][1] as FormData).get("caseId")).toBe("reserved-case");
  await expect.element(page.getByRole("button", { name: "Remove uploaded case" })).not.toBeInTheDocument();
});

test("updated case props replace a previously tracked upload reservation", async () => {
  mocks.prepare.mockResolvedValue({ status: "prepared", message: "Uploading…", activityId: "test-activity", caseId: "reserved-case", path: "reserved", token: "signed-token", expectedMimeType: "image/jpeg" });
  mocks.upload.mockResolvedValue({ error: new Error("upload failed") });
  const view = await render(<CaseUploadForm activityId="test-activity" />);
  await page.getByRole("button", { name: "Use case 01", exact: true }).click();
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Upload and verify case" }).click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("The direct upload failed.");
  await view.rerender(<CaseUploadForm activityId="test-activity" caseId="replacement-case" />);
  await page.getByRole("button", { name: "Remove uploaded case" }).click();
  await page.getByRole("button", { name: "Remove image" }).click();
  await expect.poll(() => mocks.remove.mock.calls.length).toBe(1);
  expect((mocks.remove.mock.calls[0][1] as FormData).get("caseId")).toBe("replacement-case");
});
