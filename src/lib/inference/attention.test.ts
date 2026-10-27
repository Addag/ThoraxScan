import { describe, expect, it } from "vitest";
import { InferenceError } from "./errors";
import { readyAttention } from "./attention";

describe("attention output contract", () => {
  it("accepts exactly 49 normalized values", () => {
    const result = readyAttention(Array.from({ length: 49 }, (_, index) => index / 48));
    expect(result.status).toBe("ready");
    if (result.status === "ready") expect(result.values).toHaveLength(49);
  });
  it.each([[], Array.from({ length: 48 }, () => 0), Array.from({ length: 49 }, () => 1.1)])("rejects invalid attention values", (values) => {
    expect(() => readyAttention(values)).toThrowError(InferenceError);
  });
});

import { ATTENTION_DESCRIPTOR, parseModelManifest } from "./contract";
import { createTestManifest } from "./test-manifest";
it("parses V2 evidence and rejects unmeasured provider parity", () => {
 const base = createTestManifest();
 const v2 = { ...base, schemaVersion: 2, attention: ATTENTION_DESCRIPTOR, validation: { ...base.validation, expectedAttentionSha256: "a".repeat(64), maxAbsoluteAttentionError: 0, webGpuMaxAbsoluteAttentionDifference: null } };
 expect(parseModelManifest(v2).schemaVersion).toBe(2);
 expect(() => parseModelManifest({ ...v2, attention: { ...v2.attention, grid: { width: 8, height: 7 } } })).toThrow();
 expect(() => parseModelManifest({ ...v2, validation: { ...v2.validation, maxAbsoluteAttentionError: 0.01 } })).toThrow();
});

import { ATTENTION_RAMP, attentionColor, upsampleAttention } from "./attention";
describe("attention display", () => {
  it("maps the ends of the scale to blue and red", () => {
    expect(attentionColor(0)).toEqual(ATTENTION_RAMP[0][1]);
    expect(attentionColor(1)).toEqual(ATTENTION_RAMP.at(-1)![1]);
    expect(attentionColor(0.5)).toEqual([60, 200, 90]);
  });
  it("smooths between patch centers without inventing values", () => {
    const values = Array.from({ length: 49 }, (_, index) => index / 48);
    const smooth = upsampleAttention(values, 112);
    expect(smooth).toHaveLength(112 * 112);
    expect(smooth[0]).toBe(0);
    expect(smooth.at(-1)).toBe(1);
    expect(smooth[(3 * 16 + 8) * 112 + 3 * 16 + 8]).toBeCloseTo(values[24], 1); // 16 px per patch: centers fall between pixels
    expect(Math.min(...smooth)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...smooth)).toBeLessThanOrEqual(1);
    const row = smooth.slice(56 * 112, 57 * 112);
    expect(row.every((value, index) => index === 0 || value >= row[index - 1])).toBe(true);
  });
});
