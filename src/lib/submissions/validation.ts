import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { CAM_CELLS } from "@/lib/inference/attention";
import type { LabelAnswers, SubmissionFieldErrors, SubmissionValues } from "./types";

export const ANSWER_LIMIT = 2000;
export const HEATMAP_LENGTH = ACTIVITY_AI_LABELS.length * CAM_CELLS;
// Match the database's ASCII whitespace trimming and Unicode character counts.
const trim = (value: string) => value.replace(/^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g, "");

/** Known labels only, without repeats, in the fixed label order the database stores. */
export function normalizeLabels(input: readonly unknown[]): ActivityAILabel[] {
  return ACTIVITY_AI_LABELS.filter((label) => input.includes(label));
}
// Mirrors private.valid_answer_labels: at least one label, and "No Finding" only on its own.
export function labelsError(labels: readonly ActivityAILabel[]): string | undefined {
  if (!labels.length) return "Select at least one label.";
  if (labels.length > 1 && labels.includes("No Finding")) return "No Finding cannot be combined with other labels.";
}
/** Trimmed, non-empty answers for selected labels only, as save_student_activity_submission stores them. */
export function normalizeAnswers(input: Record<string, unknown>, labels: readonly ActivityAILabel[]): LabelAnswers {
  const answers: LabelAnswers = {};
  for (const label of labels) {
    const value = input[label];
    if (typeof value === "string" && trim(value)) answers[label] = trim(value);
  }
  return answers;
}
/** The selected findings that have at least one marked cell. "No Finding" has no location, so it never appears. */
export function paintedLabels(map: readonly number[] | null, labels: readonly string[]): ActivityAILabel[] {
  if (!map) return [];
  return ACTIVITY_AI_LABELS.filter((label, index) => label !== "No Finding" && labels.includes(label)
    && map.slice(index * CAM_CELLS, (index + 1) * CAM_CELLS).some((value) => value > 0));
}
/** The findings that still need a marked cell before a final submission. */
export function unpaintedFindings(map: readonly number[] | null, labels: readonly ActivityAILabel[]) {
  const painted = paintedLabels(map, labels);
  return labels.filter((label) => label !== "No Finding" && !painted.includes(label));
}
export function validateSubmission(values: SubmissionValues, finalize: boolean, heatmapRequired: boolean): SubmissionFieldErrors {
  const errors: SubmissionFieldErrors = {};
  const labels = labelsError(values.labels);
  if (labels) errors.labels = labels;
  const long = Object.entries(values.answers).find(([, answer]) => [...(answer ?? "")].length > ANSWER_LIMIT);
  if (long) errors.answers = `Keep your ${long[0]} answer to ${ANSWER_LIMIT.toLocaleString()} characters.`;
  const missing = finalize && heatmapRequired ? unpaintedFindings(values.heatmap, values.labels) : [];
  if (missing.length) errors.heatmap = `Mark where each finding is on the heatmap: ${missing.join(", ")}.`;
  return errors;
}
/** Ticking "No Finding" clears the rest, and ticking anything else clears "No Finding". */
export function toggleLabel(labels: readonly ActivityAILabel[], label: ActivityAILabel): ActivityAILabel[] {
  if (labels.includes(label)) return labels.filter((item) => item !== label);
  return label === "No Finding" ? [label] : normalizeLabels([...labels.filter((item) => item !== "No Finding"), label]);
}
/** Which selected labels are in the answer key, which key labels were missed, and which picks are extra. A guide for grading, not a score. */
export function compareLabels(selected: readonly string[], key: readonly string[]) {
  return {
    correct: selected.filter((label) => key.includes(label)),
    extra: selected.filter((label) => !key.includes(label)),
    missed: key.filter((label) => !selected.includes(label)),
  };
}
/** How much of the validated key the AI found on its own, e.g. "2 of 3 (67%)". */
export function aiAccuracy(aiFindings: readonly string[], key: readonly string[]) {
  const found = compareLabels(aiFindings, key).correct.length;
  return key.length ? `${found} of ${key.length} (${Math.round((100 * found) / key.length)}%)` : null;
}
