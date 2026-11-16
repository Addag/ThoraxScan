import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import type { SubmissionFieldErrors, SubmissionValues } from "./types";

/** Known labels only, without repeats, in the fixed label order the database stores. */
export function normalizeLabels(input: readonly unknown[]): ActivityAILabel[] {
  return ACTIVITY_AI_LABELS.filter((label) => input.includes(label));
}
// Mirrors private.valid_answer_labels: at least one label, and "No Finding" only on its own.
export function labelsError(labels: readonly ActivityAILabel[]): string | undefined {
  if (!labels.length) return "Select at least one label.";
  if (labels.length > 1 && labels.includes("No Finding")) return "No Finding cannot be combined with other labels.";
}
export function validateSubmission(values: SubmissionValues): SubmissionFieldErrors {
  const error = labelsError(values.labels);
  return error ? { labels: error } : {};
}
/** Ticking "No Finding" clears the rest, and ticking anything else clears "No Finding". */
export function toggleLabel(labels: readonly ActivityAILabel[], label: ActivityAILabel): ActivityAILabel[] {
  if (labels.includes(label)) return labels.filter((item) => item !== label);
  return label === "No Finding" ? [label] : normalizeLabels([...labels.filter((item) => item !== "No Finding"), label]);
}
/**
 * Same formula as save_student_activity_submission: correct picks over the key plus wrong extra picks,
 * so ticking every label does not score 100. Also used for the AI-versus-key accuracy line.
 */
export function scoreLabels(selected: readonly string[], key: readonly string[]) {
  const correct = selected.filter((label) => key.includes(label));
  const extra = selected.filter((label) => !key.includes(label));
  const missed = key.filter((label) => !selected.includes(label));
  const score = key.length ? Math.round((10000 * correct.length) / (key.length + extra.length)) / 100 : 0;
  return { correct, extra, missed, score };
}
/** How much of the validated key the AI found on its own, e.g. "2 of 3 (67%)". */
export function aiAccuracy(aiFindings: readonly string[], key: readonly string[]) {
  const found = scoreLabels(aiFindings, key).correct.length;
  return key.length ? `${found} of ${key.length} (${Math.round((100 * found) / key.length)}%)` : null;
}
