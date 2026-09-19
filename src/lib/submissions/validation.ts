import type { SubmissionFieldErrors, SubmissionValues } from "./types";

// Match the database's ASCII whitespace trimming and Unicode character counts.
const trim = (value: string) => value.replace(/^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g, "");
export function normalizeSubmission(input: SubmissionValues): SubmissionValues {
  const classification = trim(input.classification);
  return {
    visibleFindings: trim(input.visibleFindings), classification,
    relevantRegion: classification === "normal" ? "" : trim(input.relevantRegion),
  };
}
export function validateSubmission(values: SubmissionValues, finalize: boolean): SubmissionFieldErrors {
  const errors: SubmissionFieldErrors = {};
  if ([...values.visibleFindings].length > 5000) errors.visibleFindings = "Use no more than 5,000 characters.";
  if ([...values.relevantRegion].length > 200) errors.relevantRegion = "Use no more than 200 characters.";
  if (values.classification && !["normal", "abnormal"].includes(values.classification)) errors.classification = "Select normal or abnormal.";
  if (finalize) {
    if (!values.visibleFindings) errors.visibleFindings = "Describe your visible findings.";
    if (!values.classification) errors.classification = "Select normal or abnormal.";
    if (values.classification === "abnormal" && !values.relevantRegion) errors.relevantRegion = "Identify the relevant region for an abnormal response.";
  } else if (!values.visibleFindings && !values.classification && !values.relevantRegion) {
    errors.visibleFindings = "Enter at least one response before saving a draft.";
  }
  return errors;
}
