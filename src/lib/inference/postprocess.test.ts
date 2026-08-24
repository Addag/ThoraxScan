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

  it("rejects non-finite and wrongly shaped output", () => {
    expect(() => postprocessLogits([Number.NaN, ...Array(13).fill(0)], createTestManifest())).toThrow(
      /finite/,
    );
    expect(() => postprocessLogits([0], createTestManifest())).toThrow(/Expected 14 logits/);
  });
});
