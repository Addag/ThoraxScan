import {
  THORAXSCAN_LABELS,
  type ModelManifestV1,
} from "./contract";

const HASH = "a".repeat(64);

export function createTestManifest(
  overrides: Partial<ModelManifestV1> = {},
): ModelManifestV1 {
  return {
    schemaVersion: 1,
    release: {
      id: "test-release",
      modelFamily: "test-family",
      checkpoint: { id: "test-checkpoint", sha256: HASH },
      sourceVersion: "test-source",
      preprocessingVersion: "preprocessing-v1",
      thresholdVersion: "thresholds-v1",
    },
    artifact: {
      format: "onnx",
      opset: 17,
      externalData: false,
      sha256: HASH,
      byteSize: 1024,
      path: `artifacts/sha256/${HASH}/model.onnx`,
    },
    input: { name: "input", dtype: "float32", shape: ["batch", 1, 224, 224] },
    output: { name: "logits", dtype: "float32", shape: ["batch", 14] },
    preprocessing: {
      colorSpace: "grayscale",
      colorConversion: "rec601-luma",
      resize: { width: 224, height: 224, interpolation: "bilinear-center" },
      alpha: "reject",
      pixelRange: [0, 1],
      mean: 0.5,
      standardDeviation: 0.25,
      layout: "NCHW",
    },
    labels: THORAXSCAN_LABELS.map((name) => ({ name, threshold: 0.5 })),
    postprocessing: {
      activation: "sigmoid",
      thresholdComparison: ">=",
      noFindingConflict: "suppress-when-abnormal",
      noMatch: "explicit",
    },
    validation: {
      preprocessingFixtureSha256: HASH,
      expectedTensorSha256: HASH,
      modelInputSha256: HASH,
      expectedLogitsSha256: HASH,
      expectedProbabilitiesSha256: HASH,
      preprocessingReferenceSha256: HASH,
      maxAbsoluteLogitError: 1e-4,
      maxRelativeLogitError: 1e-3,
      maxAbsoluteProbabilityError: 1e-4,
      webGpuEnabled: false,
      webGpuMaxAbsoluteDifference: null,
    },
    ...overrides,
  };
}
