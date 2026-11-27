import { describe, expect, it } from "vitest";
import { ACTIVITY_AI_LABELS } from "./types";
import { toActivityAIPersistencePayload } from "./adapter";
import type { InferenceResult } from "@/lib/inference/runtime";

function result(): InferenceResult {
  return {
    state: "no-threshold-match",
    labels: ACTIVITY_AI_LABELS.map((label) => ({ label, probability: 0.1, threshold: 0.5, predicted: false, possible: false })),
    findings: [], possibleFindings: [], releaseId: "release-a", modelReleaseId: 1, modelSha256: "a".repeat(64), bundleSha256: "b".repeat(64),
    preprocessingVersion: "prep-1", thresholdVersion: "threshold-1", manifestVersion: 1, executionProvider: "wasm", applicationBuild: "test",
  };
}

describe("activity AI persistence adapter", () => {
  it("preserves the canonical 14-label order and provenance", () => {
    const payload = toActivityAIPersistencePayload(result());
    expect(payload.probabilities).toHaveLength(14);
    expect(payload.probabilities.every((value) => value === 0.1)).toBe(true);
    expect(payload.releaseProvenance.releaseId).toBe("release-a");
    expect(payload.attentionMap).toBeNull();
  });

  it("rejects a reordered label vector", () => {
    const next = result();
    [next.labels[0], next.labels[1]] = [next.labels[1], next.labels[0]];
    expect(() => toActivityAIPersistencePayload(next)).toThrow(/fixed 14-label|persistence contract/);
  });
});

it("persists a validated V2 map and rejects missing or malformed maps", () => {
 const next = result(); next.manifestVersion = 2;
 expect(() => toActivityAIPersistencePayload(next)).toThrow();
 next.attention = { status: "ready", kind: "global", values: Array(49).fill(0.5), width: 7, height: 7, attribution: "global", aggregation: "attention-rollout-mean-query-v1", normalization: "per-image-min-max-v1" };
 expect(toActivityAIPersistencePayload(next).attentionMap).toHaveLength(49);
 if (next.attention.status === "ready") next.attention.values.pop();
 expect(() => toActivityAIPersistencePayload(next)).toThrow();
});

it("persists V3 per-label maps and rejects a global map on a V3 release", () => {
 const next = result(); next.manifestVersion = 3;
 next.attention = { status: "ready", kind: "global", values: Array(49).fill(0.5), width: 7, height: 7, attribution: "global", aggregation: "attention-rollout-mean-query-v1", normalization: "per-image-min-max-v1" };
 expect(() => toActivityAIPersistencePayload(next)).toThrow();
 next.attention = { status: "ready", kind: "per-label", values: Array(2744).fill(0.25), width: 14, height: 14, method: "cam-fc-weights-v1", normalization: "relu-per-label-max-v1" };
 expect(toActivityAIPersistencePayload(next).attentionMap).toHaveLength(2744);
});
