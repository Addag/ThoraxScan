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
// Display-only smoothing: bilinear interpolation between the 7×7 patch centers, clamped at the edges.
export function upsampleAttention(values: number[], size: number): number[] {
  const axis = (pixel: number) => {
    const grid = Math.min(6, Math.max(0, (pixel + 0.5) * 7 / size - 0.5));
    const low = Math.floor(grid);
    return [low, Math.min(6, low + 1), grid - low] as const;
  };
  return Array.from({ length: size * size }, (_, index) => {
    const [x0, x1, tx] = axis(index % size), [y0, y1, ty] = axis(Math.floor(index / size));
    const top = values[y0 * 7 + x0] * (1 - tx) + values[y0 * 7 + x1] * tx;
    const bottom = values[y1 * 7 + x0] * (1 - tx) + values[y1 * 7 + x1] * tx;
    return top * (1 - ty) + bottom * ty;
  });
}
