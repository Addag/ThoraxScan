import type { ActivityAILabel } from "@/lib/activity-ai/types";

export type SubmissionStatus = "draft" | "submitted";
export type LabelAnswers = Partial<Record<ActivityAILabel, string>>;
// heatmap: 14 labels x 14x14 cells in label order, the layout of the AI's class activation maps. Null until marked.
export type SubmissionValues = { labels: ActivityAILabel[]; answers: LabelAnswers; heatmap: number[] | null };
export type StudentSubmission = SubmissionValues & {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};
export type SubmissionFieldErrors = Partial<Record<"labels" | "answers" | "heatmap", string>>;
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
