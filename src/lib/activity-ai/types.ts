import type { AttentionHeatmap } from "@/lib/inference/attention";
import type { ThoraxScanLabel } from "@/lib/inference/contract";

export const ACTIVITY_AI_LABELS = [
  "No Finding",
  "Enlarged Cardiomediastinum",
  "Cardiomegaly",
  "Lung Opacity",
  "Lung Lesion",
  "Edema",
  "Consolidation",
  "Pneumonia",
  "Atelectasis",
  "Pneumothorax",
  "Pleural Effusion",
  "Pleural Other",
  "Fracture",
  "Support Devices",
] as const satisfies readonly ThoraxScanLabel[];

export type ActivityAILabel = (typeof ACTIVITY_AI_LABELS)[number];
export type ActivityAIProvider = "webgpu" | "wasm";
export type ActivityAIStatus = "locked" | "not_started" | "pending" | "ready" | "failed";
export type ActivityAISafeErrorCode =
  | "no_active_model"
  | "unsupported_manifest"
  | "artifact_integrity_failed"
  | "preprocessing_failed"
  | "model_load_failed"
  | "invalid_output"
  | "case_unavailable"
  | "recording_failed"
  | "stale_release"
  | "aborted";

export type ActivityAIProbability = {
  label: ActivityAILabel;
  probability: number;
  threshold: number;
  predicted: boolean;
  possible: boolean;
};

export type ActivityAIProvenance = {
  releaseId: string;
  modelSha256: string;
  bundleSha256: string;
  manifestVersion: 1 | 2 | 3;
  preprocessingVersion: string;
  thresholdVersion: string;
  executionProvider: ActivityAIProvider;
  applicationBuild: string;
};

export type ActivityAIResult = {
  state: "predicted" | "no-threshold-match";
  labels: ActivityAIProbability[];
  findings: ActivityAIProbability[];
  possibleFindings: ActivityAIProbability[];
  provenance: ActivityAIProvenance;
  attention?: AttentionHeatmap;
  attentionStatus: "ready" | "unavailable";
};

export type ActivityAIFeedback = {
  status: ActivityAIStatus;
  attemptCount: number;
  safeErrorCode: ActivityAISafeErrorCode | null;
  attemptedAt: string | null;
  completedAt: string | null;
  result: ActivityAIResult | null;
};

export type ActivityAIStatusProjection = {
  status: ActivityAIStatus;
  attemptCount: number;
  safeErrorCode: ActivityAISafeErrorCode | null;
  attemptedAt: string | null;
  claimExpiresAt: string | null;
  completedAt: string | null;
  releaseId: string | null;
  manifestVersion: 1 | 2 | 3 | null;
  preprocessingVersion: string | null;
  thresholdVersion: string | null;
  executionProvider: ActivityAIProvider | null;
  applicationBuild: string | null;
  attentionStatus: "ready" | "unavailable";
};

export function isActivityAILabel(value: unknown): value is ActivityAILabel {
  return typeof value === "string" && (ACTIVITY_AI_LABELS as readonly string[]).includes(value);
}
