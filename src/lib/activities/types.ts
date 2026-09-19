import type { StudentSubmission, SubmissionStatus } from "@/lib/submissions/types";
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
};

export type StudentActivitySummary = {
  submissionStatus: SubmissionStatus | null;
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
