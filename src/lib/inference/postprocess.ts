import type { ModelManifest, ThoraxScanLabel } from "./contract";
import { InferenceError } from "./errors";

export interface LabelPrediction {
  label: ThoraxScanLabel;
  probability: number;
  threshold: number;
  predicted: boolean;
  /** Below its threshold but at or above the release's possible threshold (Learning Mode tier). */
  possible: boolean;
}

export interface PostprocessedPrediction {
  state: "predicted" | "no-threshold-match";
  labels: LabelPrediction[];
  findings: LabelPrediction[];
  /** Abnormal labels in the possible tier; empty when the release has no possible thresholds. */
  possibleFindings: LabelPrediction[];
}

export function sigmoid(logit: number) {
  if (!Number.isFinite(logit)) {
    throw new InferenceError("INVALID_OUTPUT", "Model logits must be finite.");
  }
  if (logit >= 0) return 1 / (1 + Math.exp(-logit));
  const exponential = Math.exp(logit);
  return exponential / (1 + exponential);
}

export function postprocessLogits(
  logits: readonly number[],
  manifest: ModelManifest,
): PostprocessedPrediction {
  if (logits.length !== manifest.labels.length) {
    throw new InferenceError(
      "INVALID_OUTPUT",
      `Expected ${manifest.labels.length} logits, received ${logits.length}.`,
    );
  }

  const labels = manifest.labels.map(({ name, threshold, possibleThreshold }, index) => {
    const probability = sigmoid(logits[index]);
    const predicted = probability >= threshold;
    return {
      label: name,
      probability,
      threshold,
      predicted,
      possible:
        !predicted &&
        name !== "No Finding" &&
        possibleThreshold !== undefined &&
        probability >= possibleThreshold,
    };
  });
  const thresholdMatches = labels.filter((item) => item.predicted);
  const abnormalFindings = thresholdMatches.filter(
    (item) => item.label !== "No Finding",
  );
  const findings =
    abnormalFindings.length > 0
      ? abnormalFindings
      : thresholdMatches.filter((item) => item.label === "No Finding");

  return {
    state: findings.length > 0 ? "predicted" : "no-threshold-match",
    labels,
    findings,
    possibleFindings: labels.filter((item) => item.possible),
  };
}

type ReportLabel = { label: string; probability: number; predicted: boolean; possible: boolean };
export interface AnalysisReport { exam: string; interpretation: string[]; impression: string }

// Each line covers only labels the model scores; nothing is said about structures it never sees.
const reportGroups: { labels: string[]; normal: string | null; abnormal: (names: string) => string }[] = [
  { labels: ["Lung Opacity", "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis"], normal: "There are no active lung parenchymal infiltrates.", abnormal: (names) => `The lungs show ${names}.` },
  { labels: ["Cardiomegaly"], normal: "The heart is not enlarged.", abnormal: (names) => `The heart appears enlarged: ${names}.` },
  { labels: ["Enlarged Cardiomediastinum"], normal: "The cardiomediastinal silhouette is within normal limits.", abnormal: (names) => `The cardiomediastinal silhouette appears widened: ${names}.` },
  { labels: ["Pleural Effusion", "Pneumothorax", "Pleural Other"], normal: "No pleural effusion or pneumothorax is seen.", abnormal: (names) => `The pleura show ${names}.` },
  { labels: ["Fracture"], normal: "The osseous structures are unremarkable.", abnormal: (names) => `A fracture is flagged: ${names}.` },
  { labels: ["Support Devices"], normal: null, abnormal: () => "Support devices are present." },
];

const percent = (item: ReportLabel) => `${item.label} (${Math.round(item.probability * 100)}%)`;
const joinNames = (names: string[]) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/** Radiographic-report wording (exam, interpretation, impression) built from the label scores. */
export function analysisReport({ state, labels }: { state: "predicted" | "no-threshold-match"; labels: ReportLabel[] }): AnalysisReport {
  const interpretation: string[] = [];
  for (const group of reportGroups) {
    const items = labels.filter((item) => group.labels.includes(item.label));
    const likely = items.filter((item) => item.predicted);
    const possible = items.filter((item) => item.possible);
    if (likely.length) interpretation.push(group.abnormal(joinNames(likely.map(percent))));
    else if (group.normal && state === "predicted") interpretation.push(group.normal);
    if (possible.length) interpretation.push(`May also show ${joinNames(possible.map(percent))} (possible, check the image).`);
  }
  const abnormal = labels.filter((item) => item.predicted && item.label !== "No Finding");
  const possibleCount = labels.filter((item) => item.possible).length;
  const impression = (state === "no-threshold-match" ? "Indeterminate: no finding met its threshold."
    : abnormal.length ? `Findings suggest ${joinNames(abnormal.map((item) => item.label))}.`
    : "No significant chest findings.")
    + (possibleCount ? ` ${possibleCount} possible finding${possibleCount === 1 ? "" : "s"} need${possibleCount === 1 ? "s" : ""} your review.` : "");
  // Learning Mode accepts frontal and lateral uploads and nothing here knows which, so no view is named.
  return { exam: "X-ray, chest", interpretation, impression };
}
