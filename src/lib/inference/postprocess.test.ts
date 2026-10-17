import { describe, expect, it } from "vitest";
import { postprocessLogits } from "./postprocess";
import { createTestManifest } from "./test-manifest";

describe("postprocessLogits", () => {
  it("uses inclusive thresholds", () => {
    const result = postprocessLogits(Array(14).fill(0), createTestManifest());
    expect(result.labels.every((label) => label.predicted)).toBe(true);
  });

  it("suppresses No Finding when an abnormal finding matches", () => {
    const result = postprocessLogits([1, 1, ...Array(12).fill(-10)], createTestManifest());
    expect(result.findings.map(({ label }) => label)).toEqual([
      "Enlarged Cardiomediastinum",
    ]);
  });

  it("returns an explicit no-match result", () => {
    const result = postprocessLogits(Array(14).fill(-10), createTestManifest());
    expect(result.state).toBe("no-threshold-match");
    expect(result.findings).toEqual([]);
  });

  it("marks abnormal labels between the possible threshold and the threshold as possible", () => {
    const manifest = createTestManifest();
    const tiered = { ...manifest, labels: manifest.labels.map((item) => ({ ...item, threshold: 0.6, possibleThreshold: 0.3 })) };
    // probabilities: No Finding 0.5, Cardiomegaly ~0.88, Edema 0.5, everything else ~0.02
    const logits = tiered.labels.map((_, i) => (i === 0 || i === 5 ? 0 : i === 2 ? 2 : -4));
    const result = postprocessLogits(logits, tiered);
    expect(result.findings.map(({ label }) => label)).toEqual(["Cardiomegaly"]);
    expect(result.possibleFindings.map(({ label }) => label)).toEqual(["Edema"]); // never No Finding
  });

  it("has no possible findings when the release defines no possible thresholds", () => {
    const result = postprocessLogits(Array(14).fill(-0.5), createTestManifest());
    expect(result.possibleFindings).toEqual([]);
  });

  it("rejects non-finite and wrongly shaped output", () => {
    expect(() => postprocessLogits([Number.NaN, ...Array(13).fill(0)], createTestManifest())).toThrow(
      /finite/,
    );
    expect(() => postprocessLogits([0], createTestManifest())).toThrow(/Expected 14 logits/);
  });
});
