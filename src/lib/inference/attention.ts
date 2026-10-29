import { InferenceError } from "./errors";

export const CAM_GRID = 14;
export const CAM_CELLS = CAM_GRID * CAM_GRID;
export const CAM_LABEL_COUNT = 14;

export type AttentionHeatmap = { status: "unavailable"; reason: "legacy-model-release" } | {
  status: "ready"; kind: "global"; values: number[]; width: 7; height: 7; attribution: "global";
  aggregation: "attention-rollout-mean-query-v1"; normalization: "per-image-min-max-v1";
} | {
  // One 14×14 class activation map per label, concatenated in manifest label order.
  status: "ready"; kind: "per-label"; values: number[]; width: 14; height: 14;
  method: "cam-fc-weights-v1"; normalization: "relu-per-label-max-v1";
};
export const UNAVAILABLE_ATTENTION = { status: "unavailable", reason: "legacy-model-release" } as const;
function normalizedValues(values: unknown, length: number, name: string): number[] {
  if (!Array.isArray(values) || values.length !== length || values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new InferenceError("INVALID_OUTPUT", `${name} requires exactly ${length} finite normalized values.`);
  }
  return [...values];
}
export function readyAttention(values: unknown): AttentionHeatmap {
  return { status: "ready", kind: "global", values: normalizedValues(values, 49, "Attention"), width: 7, height: 7, attribution: "global",
    aggregation: "attention-rollout-mean-query-v1", normalization: "per-image-min-max-v1" };
}
export function readyClassActivation(values: unknown): AttentionHeatmap {
  return { status: "ready", kind: "per-label", values: normalizedValues(values, CAM_LABEL_COUNT * CAM_CELLS, "Class activation"), width: 14, height: 14,
    method: "cam-fc-weights-v1", normalization: "relu-per-label-max-v1" };
}
/** Rebuilds a persisted map; the stored method tells V3 class activation from V2 global attention. */
export function storedHeatmap(values: unknown, method: string | null | undefined): AttentionHeatmap {
  return method === "cam-fc-weights-v1" ? readyClassActivation(values) : readyAttention(values);
}
export function labelActivation(values: number[], labelIndex: number) {
  return values.slice(labelIndex * CAM_CELLS, (labelIndex + 1) * CAM_CELLS);
}

// Blue (low) to red (high) display ramp shared by the overlay and its legend.
export const ATTENTION_RAMP: [number, [number, number, number]][] = [
  [0, [30, 60, 200]], [0.25, [0, 170, 230]], [0.5, [60, 200, 90]], [0.75, [255, 200, 0]], [1, [220, 30, 30]],
];
export const attentionGradient = `linear-gradient(to right, ${ATTENTION_RAMP.map(([at, rgb]) => `rgb(${rgb}) ${at * 100}%`).join(", ")})`;
export function attentionColor(value: number): [number, number, number] {
  value = Math.min(1, Math.max(0, value));
  const upper = Math.max(1, ATTENTION_RAMP.findIndex(([at]) => at >= value));
  const [a, from] = ATTENTION_RAMP[upper - 1], [b, to] = ATTENTION_RAMP[upper];
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return [0, 1, 2].map(i => Math.round(from[i] + (to[i] - from[i]) * t)) as [number, number, number];
}
// Display-only smoothing: bilinear interpolation between the grid×grid patch centers, clamped at the edges.
export function upsampleAttention(values: number[], size: number, grid = 7): number[] {
  const last = grid - 1;
  const axis = (pixel: number) => {
    const position = Math.min(last, Math.max(0, (pixel + 0.5) * grid / size - 0.5));
    const low = Math.floor(position);
    return [low, Math.min(last, low + 1), position - low] as const;
  };
  return Array.from({ length: size * size }, (_, index) => {
    const [x0, x1, tx] = axis(index % size), [y0, y1, ty] = axis(Math.floor(index / size));
    const top = values[y0 * grid + x0] * (1 - tx) + values[y0 * grid + x1] * tx;
    const bottom = values[y1 * grid + x0] * (1 - tx) + values[y1 * grid + x1] * tx;
    return top * (1 - ty) + bottom * ty;
  });
}
