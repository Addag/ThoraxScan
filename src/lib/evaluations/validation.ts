import type { EvaluationActionState, EvaluationValues } from "./types";

export function normalizeEvaluation(values: EvaluationValues): EvaluationValues {
  return { score: values.score.trim(), remarks: values.remarks.trim(), feedback: values.feedback.trim() };
}
export function validateEvaluation(values: EvaluationValues, release: boolean) {
  const errors: NonNullable<EvaluationActionState["fieldErrors"]> = {};
  if (values.score && (!/^\d+(?:\.\d{1,2})?$/.test(values.score) || Number(values.score) > 100)) {
    errors.score = "Enter a percentage from 0.00 to 100.00 with at most two decimal places.";
  } else if (release && !values.score) errors.score = "Enter a score before release.";
  for (const field of ["remarks", "feedback"] as const) {
    if (Array.from(values[field]).length > 5000) errors[field] = "Use 5,000 characters or fewer.";
  }
  if (release && !values.feedback) errors.feedback = "Enter Student feedback before release.";
  if (!values.score && !values.remarks && !values.feedback && !release) errors.feedback = "Enter at least one field to save a draft.";
  return errors;
}
export function evaluationActionResult(result: unknown): EvaluationActionState {
  const messages = {
    draft_saved: "Draft saved. Students cannot see it.",
    released: "Evaluation released. It can no longer be edited.",
    already_released: "This evaluation was already released and cannot be edited. Reload to view the released evaluation.",
    invalid_payload: "Check the score and feedback before saving.",
    unavailable: "This final submission is unavailable.",
    unauthorized: "You are not authorized to review this submission.",
  };
  if (typeof result !== "string" || !Object.hasOwn(messages, result)) return { status: "error", message: "The evaluation could not be saved. Please try again." };
  const status = result as keyof typeof messages;
  return { status, message: messages[status] };
}
