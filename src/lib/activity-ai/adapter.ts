import type { InferenceResult } from "@/lib/inference/runtime";
import { ACTIVITY_AI_LABELS, type ActivityAIProvenance } from "./types";

export type ActivityAIPersistencePayload = {
  probabilities: number[];
  releaseProvenance: ActivityAIProvenance;
  provider: "webgpu" | "wasm";
  applicationBuild: string;
};

/** Converts the model's labelled result into the fixed database payload. */
export function toActivityAIPersistencePayload(result: InferenceResult): ActivityAIPersistencePayload {
  if (result.labels.length !== ACTIVITY_AI_LABELS.length) {
    throw new Error("Activity AI requires the fixed 14-label result.");
  }
  result.labels.forEach((item, index) => {
    if (item.label !== ACTIVITY_AI_LABELS[index] || !Number.isFinite(item.probability) || item.probability < 0 || item.probability > 1) {
      throw new Error("Activity AI labels or probabilities do not match the persistence contract.");
    }
  });
  return {
    probabilities: result.labels.map((item) => item.probability),
    releaseProvenance: {
      releaseId: result.releaseId,
      modelSha256: result.modelSha256,
      bundleSha256: result.bundleSha256,
      manifestVersion: result.manifestVersion,
      preprocessingVersion: result.preprocessingVersion,
      thresholdVersion: result.thresholdVersion,
      executionProvider: result.executionProvider,
      applicationBuild: result.applicationBuild,
    },
    provider: result.executionProvider,
    applicationBuild: result.applicationBuild,
  };
}

