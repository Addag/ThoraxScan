import type { StudentSubmission, SubmissionStatus } from "@/lib/submissions/types";
import type { ActivityAIFeedback, ActivityAIStatusProjection } from "@/lib/activity-ai/types";
export type ActivityStatus = "draft" | "published" | "archived";

export type CaseUploadStatus = "pending" | "ready" | "failed";

export type ProfessorActivitySummary = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  title: string;
  dueAt: string | null;
  status: ActivityStatus;
  publishedAt: string | null;
  updatedAt: string;
  hasCase: boolean;
};

export type ProfessorActivityDetails = ProfessorActivitySummary & {
  caseId: string | null;
  instructions: string;
  referenceEvaluation: string;
  caseUploadStatus: CaseUploadStatus | null;
  caseMimeType: string | null;
  caseByteSize: number | null;
  imageUrl: string | null;
  imageError: boolean;
  aiStatus: ActivityAIStatusProjection;
};

export type StudentActivitySummary = {
  submissionStatus: SubmissionStatus | null;
  aiStatus: ActivityAIFeedback["status"];
  id: string;
  workspaceId: string;
  workspaceName: string;
  title: string;
  dueAt: string | null;
  publishedAt: string;
};

export type StudentActivityDetails = StudentActivitySummary & {
  submission: StudentSubmission | null;
  instructions: string;
  imageUrl: string | null;
  imageError: boolean;
  aiFeedback: ActivityAIFeedback;
};

export type ActivityFormField =
  | "workspaceId"
  | "title"
  | "instructions"
  | "dueAt"
  | "referenceEvaluation";

export type ActivityFormState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<ActivityFormField, string>>;
};

export type CaseUploadField = "file" | "attestation";

export type CaseRemovalFormState = {
  status: "idle" | "error" | "success" | "unauthorized" | "cleanup_pending";
  message: string;
  removedCaseId?: string;
  cleanupCaseId?: string;
};

export const initialCaseRemovalFormState: CaseRemovalFormState = {
  status: "idle",
  message: "",
};

export type CaseUploadFormState = {
  status:
    | "idle"
    | "error"
    | "prepared"
    | "uploading"
    | "success"
    | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<CaseUploadField, string>>;
  activityId?: string;
  caseId?: string;
  path?: string;
  token?: string;
  expectedMimeType?: string;
};

export const initialActivityFormState: ActivityFormState = {
  status: "idle",
  message: "",
};

export const initialCaseUploadFormState: CaseUploadFormState = {
  status: "idle",
  message: "",
};
