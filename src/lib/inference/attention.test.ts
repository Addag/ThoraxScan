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
