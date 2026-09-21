import type { ModelManifest, ThoraxScanLabel } from "./contract";
import { InferenceError } from "./errors";

export interface LabelPrediction {
  label: ThoraxScanLabel;
  probability: number;
  threshold: number;
  predicted: boolean;
}

export interface PostprocessedPrediction {
  state: "predicted" | "no-threshold-match";
  labels: LabelPrediction[];
  findings: LabelPrediction[];
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

  const labels = manifest.labels.map(({ name, threshold }, index) => {
    const probability = sigmoid(logits[index]);
    return {
      label: name,
      probability,
      threshold,
      predicted: probability >= threshold,
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
  };
}
