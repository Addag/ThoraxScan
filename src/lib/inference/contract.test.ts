import { describe, expect, it } from "vitest";
import { parseModelManifest, parseThresholds, THORAXSCAN_LABELS } from "./contract";
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

  it("rejects reordered labels and invalid thresholds", () => {
    const thresholds = Object.fromEntries(
      [...THORAXSCAN_LABELS].reverse().map((name) => [name, 0.5]),
    );
    expect(() => parseThresholds(thresholds)).toThrow(/fixed 14-label order/);

    const ordered = Object.fromEntries(THORAXSCAN_LABELS.map((name) => [name, 0.5]));
    ordered["Pneumonia"] = 1.1;
    expect(() => parseThresholds(ordered)).toThrow(/between 0 and 1/);
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
