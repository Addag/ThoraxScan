import { InferenceError } from "./errors";

export type AttentionHeatmap = { status: "unavailable"; reason: "legacy-model-release" } | {
  status: "ready"; values: number[]; width: 7; height: 7; attribution: "global";
  aggregation: "attention-rollout-mean-query-v1"; normalization: "per-image-min-max-v1";
};
export const UNAVAILABLE_ATTENTION = { status: "unavailable", reason: "legacy-model-release" } as const;
export function readyAttention(values: unknown): AttentionHeatmap {
  if (!Array.isArray(values) || values.length !== 49 || values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new InferenceError("INVALID_OUTPUT", "Attention requires exactly 49 finite normalized values.");
  }
  return { status: "ready", values: [...values], width: 7, height: 7, attribution: "global",
    aggregation: "attention-rollout-mean-query-v1", normalization: "per-image-min-max-v1" };
}
