export type ReviewStatus = "unreviewed" | "draft" | "released";
export type ProfessorEvaluation = {
  id: string; professor_id: string; score: number | null; remarks: string; feedback: string;
  status: "draft" | "released"; released_at: string | null; updated_at: string;
};
// Intentionally has no private remarks, evaluator identity, or draft fields.
export type StudentFacultyEvaluation =
  | { status: "locked" | "awaiting_review" }
  | { status: "released"; score: number; feedback: string; releasedAt: string };
export type EvaluationValues = { score: string; remarks: string; feedback: string };
export type EvaluationActionState = {
  status: "idle" | "error" | "draft_saved" | "released" | "already_released" | "invalid_payload" | "unavailable" | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<keyof EvaluationValues, string>>;
};
export const initialEvaluationState: EvaluationActionState = { status: "idle", message: "" };
export const evaluationUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
