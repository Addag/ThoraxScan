import type { ActivityAILabel } from "@/lib/activity-ai/types";

export type SubmissionStatus = "draft" | "submitted";
export type SubmissionValues = { labels: ActivityAILabel[] };
export type StudentSubmission = SubmissionValues & {
  id: string;
  status: SubmissionStatus;
  // Set when the answer is finalized; older text-only finals have none.
  labelScore: number | null;
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
