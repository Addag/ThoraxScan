import { describe, expect, it } from "vitest";
import { parseModelManifest, parseReleaseSource, parseThresholds, THORAXSCAN_LABELS } from "./contract";
import { createTestManifest } from "./test-manifest";

describe("ModelManifestV1", () => {
  it("accepts the fixed version 1 contract", () => {
    expect(parseModelManifest(createTestManifest())).toEqual(createTestManifest());
  });

  it("rejects contract changes without a new manifest version", () => {
    const manifest = createTestManifest();
    const changed = {
      ...manifest,
      input: { ...manifest.input, shape: ["batch", 3, 224, 224] },
    };

    expect(() => parseModelManifest(changed)).toThrow(/input\.shape/);
  });

  it("accepts the short-side-320 resize and rejects unknown resize modes", () => {
    const manifest = createTestManifest();
    const resize = (interpolation: string) => ({
      ...manifest,
      preprocessing: { ...manifest.preprocessing, resize: { ...manifest.preprocessing.resize, interpolation } },
    });
    expect(parseModelManifest(resize("shortside320-bilinear-center"))).toEqual(resize("shortside320-bilinear-center"));
    expect(() => parseModelManifest(resize("area"))).toThrow(/preprocessing configuration/);
  });

  it("defaults release.json to the single-stage resize", () => {
    const source = {
      releaseId: "test-release-20261030.1",
      modelFamily: "thoraxscan-classifier",
      checkpoint: { id: "checkpoint", sha256: "a".repeat(64) },
      sourceVersion: "source",
      preprocessingVersion: "preprocessing",
      thresholdVersion: "thresholds",
    };
    expect(parseReleaseSource(source).resizeInterpolation).toBe("bilinear-center");
    expect(parseReleaseSource({ ...source, resizeInterpolation: "shortside320-bilinear-center" }).resizeInterpolation)
      .toBe("shortside320-bilinear-center");
    expect(() => parseReleaseSource({ ...source, resizeInterpolation: "area" })).toThrow(/resizeInterpolation/);
  });

  it("rejects reordered labels and invalid thresholds", () => {
    const thresholds = Object.fromEntries(
      [...THORAXSCAN_LABELS].reverse().map((name) => [name, 0.5]),
    );
    expect(() => parseThresholds(thresholds)).toThrow(/fixed 14-label order/);

    const ordered = Object.fromEntries(THORAXSCAN_LABELS.map((name) => [name, 0.5]));
    ordered["Pneumonia"] = 1.1;
    expect(() => parseThresholds(ordered)).toThrow(/between 0 and 1/);
  });

  it("keeps optional possible thresholds and rejects partial or inverted ones", () => {
    const manifest = createTestManifest();
    const tiered = { ...manifest, labels: manifest.labels.map((item) => ({ ...item, possibleThreshold: 0.3 })) };
    expect(parseModelManifest(tiered)).toEqual(tiered);

    const partial = { ...manifest, labels: manifest.labels.map((item, i) => (i === 0 ? { ...item, possibleThreshold: 0.3 } : item)) };
    expect(() => parseModelManifest(partial)).toThrow(/every label or on none/);

    const inverted = { ...manifest, labels: manifest.labels.map((item) => ({ ...item, possibleThreshold: 0.9 })) };
    expect(() => parseModelManifest(inverted)).toThrow(/must not exceed/);
  });

  it("rejects external data and unsafe artifact paths", () => {
    const manifest = createTestManifest();
    expect(() =>
      parseModelManifest({
        ...manifest,
        artifact: { ...manifest.artifact, externalData: true },
      }),
    ).toThrow(/single-file ONNX/);
    expect(() =>
      parseModelManifest({
        ...manifest,
        artifact: { ...manifest.artifact, path: "../model.onnx" },
      }),
    ).toThrow(/content-addressed/);
  });

  it("enables WebGPU only with measured parity", () => {
    const manifest = createTestManifest();
    expect(() =>
      parseModelManifest({
        ...manifest,
        validation: {
          ...manifest.validation,
          webGpuEnabled: true,
          webGpuMaxAbsoluteDifference: 0.0011,
        },
      }),
    ).toThrow(/within 1e-3/);
    expect(
      parseModelManifest({
        ...manifest,
        validation: {
          ...manifest.validation,
          webGpuEnabled: true,
          webGpuMaxAbsoluteDifference: 0.001,
        },
      }).validation.webGpuEnabled,
    ).toBe(true);
  });
});
