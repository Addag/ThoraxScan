import { describe, expect, it } from "vitest";
import { ACTIVITY_AI_LABELS } from "./types";
import { toActivityAIPersistencePayload } from "./adapter";
import type { InferenceResult } from "@/lib/inference/runtime";

function result(): InferenceResult {
  return {
    state: "no-threshold-match",
    labels: ACTIVITY_AI_LABELS.map((label) => ({ label, probability: 0.1, threshold: 0.5, predicted: false })),
    findings: [], releaseId: "release-a", modelReleaseId: 1, modelSha256: "a".repeat(64), bundleSha256: "b".repeat(64),
    preprocessingVersion: "prep-1", thresholdVersion: "threshold-1", manifestVersion: 1, executionProvider: "wasm", applicationBuild: "test",
  };
}

describe("activity AI persistence adapter", () => {
  it("preserves the canonical 14-label order and provenance", () => {
    const payload = toActivityAIPersistencePayload(result());
    expect(payload.probabilities).toHaveLength(14);
    expect(payload.probabilities.every((value) => value === 0.1)).toBe(true);
    expect(payload.releaseProvenance.releaseId).toBe("release-a");
  });

  it("rejects a reordered label vector", () => {
    const next = result();
    [next.labels[0], next.labels[1]] = [next.labels[1], next.labels[0]];
    expect(() => toActivityAIPersistencePayload(next)).toThrow(/fixed 14-label|persistence contract/);
  });
});
