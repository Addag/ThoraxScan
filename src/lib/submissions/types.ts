export type SubmissionStatus = "draft" | "submitted";
export type SubmissionValues = { visibleFindings: string; classification: string; relevantRegion: string };
export type StudentSubmission = SubmissionValues & {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};
export type SubmissionFieldErrors = Partial<Record<keyof SubmissionValues, string>>;
export type SubmissionActionState = {
  status: "idle" | "error" | "draft_saved" | "submitted" | "already_submitted" | "deadline_passed" | "unavailable" | "unauthorized";
  message: string;
  fieldErrors?: SubmissionFieldErrors;
};
export const initialSubmissionState: SubmissionActionState = { status: "idle", message: "" };
export function submissionLabel(status: SubmissionStatus | null, dueAt: string | null, now = Date.now()) {
  if (status === "submitted") return "Submitted";
  if (dueAt && new Date(dueAt).getTime() <= now) return "Deadline passed";
  return status === "draft" ? "Draft" : "Not started";
}
