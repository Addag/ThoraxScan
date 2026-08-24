import { InferenceError } from "./errors";

export const MODEL_SLOT = "thoraxscan-classifier" as const;
export const MODEL_BUCKET = "model-artifacts" as const;
export const MODEL_MAX_BYTES = 50 * 1024 * 1024;
export const MODEL_INPUT_SIZE = 224;

export const THORAXSCAN_LABELS = [
  "No Finding",
  "Enlarged Cardiomediastinum",
  "Cardiomegaly",
  "Lung Opacity",
  "Lung Lesion",
  "Edema",
  "Consolidation",
  "Pneumonia",
  "Atelectasis",
  "Pneumothorax",
  "Pleural Effusion",
  "Pleural Other",
  "Fracture",
  "Support Devices",
] as const;

export type ThoraxScanLabel = (typeof THORAXSCAN_LABELS)[number];

export interface ReleaseSourceV1 {
  releaseId: string;
  modelFamily: string;
  checkpoint: {
    id: string;
    sha256: string;
  };
  sourceVersion: string;
  preprocessingVersion: string;
  thresholdVersion: string;
}

export interface ModelManifestV1 {
  schemaVersion: 1;
  release: {
    id: string;
    modelFamily: string;
    checkpoint: {
      id: string;
      sha256: string;
    };
    sourceVersion: string;
    preprocessingVersion: string;
    thresholdVersion: string;
  };
  artifact: {
    format: "onnx";
    opset: 17;
    externalData: false;
    sha256: string;
    byteSize: number;
    path: string;
  };
  input: {
    name: "input";
    dtype: "float32";
    shape: ["batch", 1, 224, 224];
  };
  output: {
    name: "logits";
    dtype: "float32";
    shape: ["batch", 14];
  };
  preprocessing: {
    colorSpace: "grayscale";
    colorConversion: "rec601-luma";
    resize: {
      width: 224;
      height: 224;
      interpolation: "bilinear-center";
    };
    alpha: "reject";
    pixelRange: [0, 1];
    mean: 0.5;
    standardDeviation: 0.25;
    layout: "NCHW";
  };
  labels: Array<{
    name: ThoraxScanLabel;
    threshold: number;
  }>;
  postprocessing: {
    activation: "sigmoid";
    thresholdComparison: ">=";
    noFindingConflict: "suppress-when-abnormal";
    noMatch: "explicit";
  };
  validation: {
    preprocessingFixtureSha256: string;
    expectedTensorSha256: string;
    modelInputSha256: string;
    expectedLogitsSha256: string;
    expectedProbabilitiesSha256: string;
    preprocessingReferenceSha256: string;
    maxAbsoluteLogitError: number;
    maxRelativeLogitError: number;
    maxAbsoluteProbabilityError: number;
    webGpuEnabled: boolean;
    webGpuMaxAbsoluteDifference: number | null;
  };
}

export interface ActiveModelRelease {
  modelReleaseId: number;
  releaseId: string;
  bundleSha256: string;
  manifestPath: string;
  artifactUrl: string;
  revision: number;
  manifest: ModelManifestV1;
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const RELEASE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function fail(message: string): never {
  throw new InferenceError("UNSUPPORTED_MANIFEST", message);
}

function objectValue(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${name} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, name: string, pattern?: RegExp) {
  if (typeof value !== "string" || value.trim() !== value || !value) {
    fail(`${name} must be a non-empty trimmed string.`);
  }
  if (pattern && !pattern.test(value)) fail(`${name} has an invalid format.`);
  return value;
}

function sha256Value(value: unknown, name: string) {
  return stringValue(value, name, SHA256_PATTERN);
}

function finiteNumber(value: unknown, name: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${name} must be a finite number.`);
  }
  return value;
}

function exactArray(value: unknown, expected: readonly unknown[], name: string) {
  if (
    !Array.isArray(value) ||
    value.length !== expected.length ||
    value.some((item, index) => item !== expected[index])
  ) {
    fail(`${name} does not match contract version 1.`);
  }
}

export function parseReleaseSource(value: unknown): ReleaseSourceV1 {
  const source = objectValue(value, "release.json");
  const checkpoint = objectValue(source.checkpoint, "release.checkpoint");

  return {
    releaseId: stringValue(source.releaseId, "releaseId", RELEASE_ID_PATTERN),
    modelFamily: stringValue(source.modelFamily, "modelFamily"),
    checkpoint: {
      id: stringValue(checkpoint.id, "checkpoint.id"),
      sha256: sha256Value(checkpoint.sha256, "checkpoint.sha256"),
    },
    sourceVersion: stringValue(source.sourceVersion, "sourceVersion"),
    preprocessingVersion: stringValue(
      source.preprocessingVersion,
      "preprocessingVersion",
    ),
    thresholdVersion: stringValue(source.thresholdVersion, "thresholdVersion"),
  };
}

export function parseThresholds(value: unknown) {
  const source = objectValue(value, "thresholds.json");
  const keys = Object.keys(source);

  if (
    keys.length !== THORAXSCAN_LABELS.length ||
    keys.some((key, index) => key !== THORAXSCAN_LABELS[index])
  ) {
    fail("thresholds.json must preserve the fixed 14-label order.");
  }

  return THORAXSCAN_LABELS.map((name) => {
    const threshold = finiteNumber(source[name], `thresholds.${name}`);
    if (threshold < 0 || threshold > 1) {
      fail(`thresholds.${name} must be between 0 and 1.`);
    }
    return { name, threshold };
  });
}

export function parseModelManifest(value: unknown): ModelManifestV1 {
  const manifest = objectValue(value, "manifest");
  if (manifest.schemaVersion !== 1) fail("Only manifest schemaVersion 1 is supported.");

  const release = objectValue(manifest.release, "release");
  const checkpoint = objectValue(release.checkpoint, "release.checkpoint");
  const artifact = objectValue(manifest.artifact, "artifact");
  const input = objectValue(manifest.input, "input");
  const output = objectValue(manifest.output, "output");
  const preprocessing = objectValue(manifest.preprocessing, "preprocessing");
  const resize = objectValue(preprocessing.resize, "preprocessing.resize");
  const postprocessing = objectValue(manifest.postprocessing, "postprocessing");
  const validation = objectValue(manifest.validation, "validation");

  const releaseId = stringValue(release.id, "release.id", RELEASE_ID_PATTERN);
  const modelSha256 = sha256Value(artifact.sha256, "artifact.sha256");
  const byteSize = finiteNumber(artifact.byteSize, "artifact.byteSize");
  if (!Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > MODEL_MAX_BYTES) {
    fail(`artifact.byteSize must be an integer between 1 and ${MODEL_MAX_BYTES}.`);
  }

  const artifactPath = stringValue(artifact.path, "artifact.path");
  if (artifactPath !== `artifacts/sha256/${modelSha256}/model.onnx`) {
    fail("artifact.path must be content-addressed by artifact.sha256.");
  }
  if (artifact.format !== "onnx" || artifact.opset !== 17 || artifact.externalData !== false) {
    fail("The artifact must be a single-file ONNX opset 17 model.");
  }

  if (input.name !== "input" || input.dtype !== "float32") {
    fail("The input must be the float32 tensor named input.");
  }
  exactArray(input.shape, ["batch", 1, 224, 224], "input.shape");

  if (output.name !== "logits" || output.dtype !== "float32") {
    fail("The output must be the float32 tensor named logits.");
  }
  exactArray(output.shape, ["batch", 14], "output.shape");

  if (
    preprocessing.colorSpace !== "grayscale" ||
    preprocessing.colorConversion !== "rec601-luma" ||
    preprocessing.alpha !== "reject" ||
    preprocessing.mean !== 0.5 ||
    preprocessing.standardDeviation !== 0.25 ||
    preprocessing.layout !== "NCHW" ||
    resize.width !== 224 ||
    resize.height !== 224 ||
    resize.interpolation !== "bilinear-center"
  ) {
    fail("The preprocessing configuration does not match contract version 1.");
  }
  exactArray(preprocessing.pixelRange, [0, 1], "preprocessing.pixelRange");

  const labels = parseThresholds(
    Object.fromEntries(
      (Array.isArray(manifest.labels) ? manifest.labels : []).map((item) => {
        const label = objectValue(item, "labels item");
        return [label.name, label.threshold];
      }),
    ),
  );

  if (
    postprocessing.activation !== "sigmoid" ||
    postprocessing.thresholdComparison !== ">=" ||
    postprocessing.noFindingConflict !== "suppress-when-abnormal" ||
    postprocessing.noMatch !== "explicit"
  ) {
    fail("The postprocessing configuration does not match contract version 1.");
  }

  const maxAbsoluteLogitError = finiteNumber(
    validation.maxAbsoluteLogitError,
    "validation.maxAbsoluteLogitError",
  );
  const maxRelativeLogitError = finiteNumber(
    validation.maxRelativeLogitError,
    "validation.maxRelativeLogitError",
  );
  const maxAbsoluteProbabilityError = finiteNumber(
    validation.maxAbsoluteProbabilityError,
    "validation.maxAbsoluteProbabilityError",
  );
  const webGpuEnabled = validation.webGpuEnabled;
  const webGpuMaxAbsoluteDifference = validation.webGpuMaxAbsoluteDifference;
  if (typeof webGpuEnabled !== "boolean") {
    fail("validation.webGpuEnabled must be a boolean.");
  }
  if (
    (webGpuEnabled &&
      (typeof webGpuMaxAbsoluteDifference !== "number" ||
        !Number.isFinite(webGpuMaxAbsoluteDifference) ||
        webGpuMaxAbsoluteDifference < 0 ||
        webGpuMaxAbsoluteDifference > 1e-3)) ||
    (!webGpuEnabled && webGpuMaxAbsoluteDifference !== null)
  ) {
    fail("WebGPU must be disabled unless measured within 1e-3 of WASM.");
  }
  if (
    maxAbsoluteLogitError > 1e-4 ||
    maxRelativeLogitError > 1e-3 ||
    maxAbsoluteProbabilityError > 1e-4 ||
    Math.min(
      maxAbsoluteLogitError,
      maxRelativeLogitError,
      maxAbsoluteProbabilityError,
    ) < 0
  ) {
    fail("Validation errors exceed the contract version 1 limits.");
  }

  return {
    schemaVersion: 1,
    release: {
      id: releaseId,
      modelFamily: stringValue(release.modelFamily, "release.modelFamily"),
      checkpoint: {
        id: stringValue(checkpoint.id, "release.checkpoint.id"),
        sha256: sha256Value(checkpoint.sha256, "release.checkpoint.sha256"),
      },
      sourceVersion: stringValue(release.sourceVersion, "release.sourceVersion"),
      preprocessingVersion: stringValue(
        release.preprocessingVersion,
        "release.preprocessingVersion",
      ),
      thresholdVersion: stringValue(
        release.thresholdVersion,
        "release.thresholdVersion",
      ),
    },
    artifact: {
      format: "onnx",
      opset: 17,
      externalData: false,
      sha256: modelSha256,
      byteSize,
      path: artifactPath,
    },
    input: {
      name: "input",
      dtype: "float32",
      shape: ["batch", 1, 224, 224],
    },
    output: {
      name: "logits",
      dtype: "float32",
      shape: ["batch", 14],
    },
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
    labels,
    postprocessing: {
      activation: "sigmoid",
      thresholdComparison: ">=",
      noFindingConflict: "suppress-when-abnormal",
      noMatch: "explicit",
    },
    validation: {
      preprocessingFixtureSha256: sha256Value(
        validation.preprocessingFixtureSha256,
        "validation.preprocessingFixtureSha256",
      ),
      expectedTensorSha256: sha256Value(
        validation.expectedTensorSha256,
        "validation.expectedTensorSha256",
      ),
      modelInputSha256: sha256Value(
        validation.modelInputSha256,
        "validation.modelInputSha256",
      ),
      expectedLogitsSha256: sha256Value(
        validation.expectedLogitsSha256,
        "validation.expectedLogitsSha256",
      ),
      expectedProbabilitiesSha256: sha256Value(
        validation.expectedProbabilitiesSha256,
        "validation.expectedProbabilitiesSha256",
      ),
      preprocessingReferenceSha256: sha256Value(
        validation.preprocessingReferenceSha256,
        "validation.preprocessingReferenceSha256",
      ),
      maxAbsoluteLogitError,
      maxRelativeLogitError,
      maxAbsoluteProbabilityError,
      webGpuEnabled,
      webGpuMaxAbsoluteDifference: webGpuMaxAbsoluteDifference as number | null,
    },
  };
}

export function modelPathForSha256(sha256: string) {
  return `artifacts/sha256/${sha256Value(sha256, "model sha256")}/model.onnx`;
}

export function manifestPathForSha256(sha256: string) {
  return `bundles/sha256/${sha256Value(sha256, "bundle sha256")}/manifest.json`;
}
