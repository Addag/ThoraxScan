import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { Upload } from "tus-js-client";

import {
  MODEL_BUCKET,
  MODEL_MAX_BYTES,
  THORAXSCAN_LABELS,
  manifestPathForSha256,
  modelPathForSha256,
  parseModelManifest,
  parseReleaseSource,
  parseThresholds,
  type ModelManifestV1,
} from "../src/lib/inference/contract";
import { sigmoid } from "../src/lib/inference/postprocess";
import { preprocessRgba } from "../src/lib/inference/preprocess";

const MAX_ABSOLUTE_LOGIT_ERROR = 1e-4;
const MAX_RELATIVE_LOGIT_ERROR = 1e-3;
const MAX_ABSOLUTE_PROBABILITY_ERROR = 1e-4;
const FLOAT_COUNT = 224 * 224;
const requireFromScript = createRequire(import.meta.url);

interface ValidatedBundle {
  directory: string;
  model: Buffer;
  modelInput: Float32Array;
  manifest: ModelManifestV1;
  manifestJson: string;
  bundleSha256: string;
  manifestPath: string;
  validationSummary: {
    passed: true;
    validatedAt: string;
    maxAbsoluteLogitError: number;
    maxRelativeLogitError: number;
    maxAbsoluteProbabilityError: number;
  };
}

function usage(): never {
  throw new Error(
    [
      "Usage:",
      "  npm run model:validate -- --bundle <directory>",
      "  npm run model:stage -- --bundle <directory> [--actor <identity>]",
      "  npm run model:status",
      "  npm run model:activate -- --release <id> --expected-revision <n> --reason <text> [--actor <identity>]",
      "  npm run model:rollback -- --to <id> --expected-revision <n> --reason <text> [--actor <identity>]",
    ].join("\n"),
  );
}

function parseArguments(argv: string[]) {
  const [command, ...rest] = argv;
  if (!command) usage();
  const options = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined || value.startsWith("--")) usage();
    options.set(key.slice(2), value);
  }
  return { command, options };
}

function requiredOption(options: Map<string, string>, name: string) {
  const value = options.get(name);
  if (!value) throw new Error(`--${name} is required.`);
  return value;
}

function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function jsonFile(path: string) {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${path}.`, { cause: error });
  }
}

function jsonBuffer(buffer: Buffer, path: string) {
  try {
    return JSON.parse(buffer.toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${path}.`, { cause: error });
  }
}

function floatArray(buffer: Buffer, name: string, expectedLength: number) {
  if (buffer.byteLength !== expectedLength * Float32Array.BYTES_PER_ELEMENT) {
    throw new Error(`${name} must contain ${expectedLength} little-endian float32 values.`);
  }
  return new Float32Array(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
}

function numberArray(value: unknown, name: string, expectedLength: number) {
  if (
    !Array.isArray(value) ||
    value.length !== expectedLength ||
    value.some((item) => typeof item !== "number" || !Number.isFinite(item))
  ) {
    throw new Error(`${name} must contain ${expectedLength} finite numbers.`);
  }
  return value as number[];
}

function compare(actual: readonly number[], expected: readonly number[]) {
  let maxAbsolute = 0;
  let maxRelative = 0;
  for (let index = 0; index < actual.length; index += 1) {
    const absolute = Math.abs(actual[index] - expected[index]);
    const relative = absolute / Math.max(Math.abs(expected[index]), 1e-12);
    maxAbsolute = Math.max(maxAbsolute, absolute);
    maxRelative = Math.max(maxRelative, relative);
  }
  return { maxAbsolute, maxRelative };
}

function assertOnnxEnvelope(model: Buffer) {
  const protobufPath = resolve(
    "node_modules/onnxruntime-web/lib/onnxjs/ort-schema/protobuf/onnx.js",
  );
  const generated = requireFromScript(protobufPath) as {
    onnx: {
      ModelProto: {
        decode(bytes: Uint8Array): {
          opsetImport: Array<{ domain?: string; version?: { toString(): string } | number }>;
          graph?: unknown;
        };
      };
    };
  };
  const decoded = generated.onnx.ModelProto.decode(model);
  const defaultOpset = decoded.opsetImport.find(
    ({ domain }) => !domain || domain === "ai.onnx",
  );
  const opsetVersion = Number(defaultOpset?.version?.toString());
  if (opsetVersion !== 17) {
    throw new Error(`The ONNX model must use default-domain opset 17; received ${opsetVersion}.`);
  }

  const containsExternalTensorData = (value: unknown, seen: Set<object>): boolean => {
    if (!value || typeof value !== "object" || ArrayBuffer.isView(value)) return false;
    if (seen.has(value)) return false;
    seen.add(value);
    if (Array.isArray(value)) {
      return value.some((item) => containsExternalTensorData(item, seen));
    }
    const record = value as Record<string, unknown>;
    if (
      record.dataLocation === 1 ||
      (Array.isArray(record.externalData) && record.externalData.length > 0)
    ) {
      return true;
    }
    return Object.values(record).some((item) => containsExternalTensorData(item, seen));
  };
  if (containsExternalTensorData(decoded.graph, new Set())) {
    throw new Error("External ONNX tensor data is not supported by contract version 1.");
  }
}

async function validateOnnx(
  model: Buffer,
  modelInput: Float32Array,
  expectedLogits: number[],
  expectedProbabilities: number[],
) {
  assertOnnxEnvelope(model);
  const ort = await import("onnxruntime-web");
  const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
  try {
    if (session.inputNames.length !== 1 || session.inputNames[0] !== "input") {
      throw new Error("The ONNX model must expose only the input tensor named input.");
    }
    if (session.outputNames.length !== 1 || session.outputNames[0] !== "logits") {
      throw new Error("The ONNX model must expose only the output tensor named logits.");
    }
    const tensor = new ort.Tensor("float32", modelInput, [1, 1, 224, 224]);
    const outputs = await session.run({ input: tensor }, ["logits"]);
    const logits = Array.from(outputs.logits.data as ArrayLike<number>);
    if (logits.length !== THORAXSCAN_LABELS.length || logits.some((value) => !Number.isFinite(value))) {
      throw new Error("The ONNX model did not return 14 finite logits.");
    }

    const logitError = compare(logits, expectedLogits);
    const probabilities = logits.map(sigmoid);
    const probabilityError = compare(probabilities, expectedProbabilities);
    if (
      logitError.maxAbsolute > MAX_ABSOLUTE_LOGIT_ERROR ||
      logitError.maxRelative > MAX_RELATIVE_LOGIT_ERROR ||
      probabilityError.maxAbsolute > MAX_ABSOLUTE_PROBABILITY_ERROR
    ) {
      throw new Error(
        `ONNX parity failed: abs=${logitError.maxAbsolute}, rel=${logitError.maxRelative}, probability=${probabilityError.maxAbsolute}.`,
      );
    }

    return {
      maxAbsoluteLogitError: logitError.maxAbsolute,
      maxRelativeLogitError: logitError.maxRelative,
      maxAbsoluteProbabilityError: probabilityError.maxAbsolute,
    };
  } finally {
    session.release();
  }
}

async function validateBrowserProviders(
  model: Buffer,
  modelInput: Float32Array,
  expectedLogits: number[],
) {
  const { chromium } = await import("playwright");
  const ortDistribution = resolve("node_modules/onnxruntime-web/dist");
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      response.setHeader("cross-origin-opener-policy", "same-origin");
      response.setHeader("cross-origin-embedder-policy", "require-corp");
      if (requestUrl.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end("<!doctype html><title>ThoraxScan conformance</title>");
        return;
      }
      if (requestUrl.pathname === "/model.onnx") {
        response.writeHead(200, { "content-type": "application/octet-stream" });
        response.end(model);
        return;
      }
      const fileName = requestUrl.pathname.slice(1);
      if (!/^[A-Za-z0-9._-]+$/.test(fileName)) {
        response.writeHead(404).end();
        return;
      }
      const bytes = await readFile(resolve(ortDistribution, fileName));
      response.writeHead(200, {
        "content-type": fileName.endsWith(".wasm")
          ? "application/wasm"
          : "text/javascript; charset=utf-8",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Browser conformance server did not receive a TCP port.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(baseUrl);
    await page.addScriptTag({ path: resolve(ortDistribution, "ort.webgpu.min.js") });
    const result = await page.evaluate(
      async ({ wasmBaseUrl, inputValues, referenceLogits }) => {
        const browserWindow = window as typeof window & {
          ort: {
            env: { wasm: { wasmPaths: string; numThreads: number } };
            Tensor: new (type: "float32", data: Float32Array, dimensions: number[]) => unknown;
            InferenceSession: {
              create(model: ArrayBuffer, options: { executionProviders: string[] }): Promise<{
                run(feeds: Record<string, unknown>): Promise<Record<string, { data: ArrayLike<number> }>>;
                release(): Promise<void>;
              }>;
            };
          };
        };
        const compareOutputs = (actual: number[], expected: number[]) => {
          let maxAbsolute = 0;
          let maxRelative = 0;
          for (let index = 0; index < actual.length; index += 1) {
            const absolute = Math.abs(actual[index] - expected[index]);
            maxAbsolute = Math.max(maxAbsolute, absolute);
            maxRelative = Math.max(
              maxRelative,
              absolute / Math.max(Math.abs(expected[index]), 1e-12),
            );
          }
          return { maxAbsolute, maxRelative };
        };
        browserWindow.ort.env.wasm.wasmPaths = `${wasmBaseUrl}/`;
        browserWindow.ort.env.wasm.numThreads = 1;
        const modelBytes = await (await fetch("/model.onnx")).arrayBuffer();
        const run = async (provider: "wasm" | "webgpu") => {
          const session = await browserWindow.ort.InferenceSession.create(modelBytes, {
            executionProviders: [provider],
          });
          try {
            const tensor = new browserWindow.ort.Tensor(
              "float32",
              new Float32Array(inputValues),
              [1, 1, 224, 224],
            );
            return Array.from((await session.run({ input: tensor })).logits?.data ?? []);
          } finally {
            await session.release();
          }
        };
        const wasm = await run("wasm");
        if (wasm.length !== 14 || wasm.some((value) => !Number.isFinite(value))) {
          throw new Error("Browser WASM returned invalid logits.");
        }
        const wasmError = compareOutputs(wasm, referenceLogits);
        if (wasmError.maxAbsolute > 1e-4 || wasmError.maxRelative > 1e-3) {
          throw new Error("Browser WASM did not satisfy reference parity.");
        }
        if (!("gpu" in navigator)) {
          return { webGpuEnabled: false, webGpuMaxAbsoluteDifference: null };
        }
        try {
          const webGpu = await run("webgpu");
          const providerDifference = compareOutputs(webGpu, wasm).maxAbsolute;
          return providerDifference <= 1e-3
            ? { webGpuEnabled: true, webGpuMaxAbsoluteDifference: providerDifference }
            : { webGpuEnabled: false, webGpuMaxAbsoluteDifference: null };
        } catch {
          return { webGpuEnabled: false, webGpuMaxAbsoluteDifference: null };
        }
      },
      {
        wasmBaseUrl: baseUrl,
        inputValues: Array.from(modelInput),
        referenceLogits: expectedLogits,
      },
    );
    return result;
  } finally {
    await browser.close();
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }
}

async function validateBundle(directoryOption: string): Promise<ValidatedBundle> {
  const directory = resolve(directoryOption);
  const paths = {
    model: resolve(directory, "model.onnx"),
    release: resolve(directory, "release.json"),
    thresholds: resolve(directory, "thresholds.json"),
    preprocessingReference: resolve(directory, "preprocessing-reference.py"),
    preprocessingInput: resolve(directory, "fixtures", "preprocessing-input.png"),
    expectedTensor: resolve(directory, "fixtures", "expected-tensor.f32"),
    modelInput: resolve(directory, "fixtures", "model-input.f32"),
    expectedLogits: resolve(directory, "fixtures", "expected-logits.json"),
    expectedProbabilities: resolve(directory, "fixtures", "expected-probabilities.json"),
  };

  const directoryFiles = await readdir(directory);
  if (directoryFiles.some((name) => name.endsWith(".onnx.data"))) {
    throw new Error("External ONNX data files are not supported by contract version 1.");
  }

  const [
    model,
    releaseValue,
    thresholdsValue,
    preprocessingReference,
    preprocessingInput,
    expectedTensor,
    modelInputBuffer,
    expectedLogitsValue,
    expectedProbabilitiesValue,
  ] = await Promise.all([
    readFile(paths.model),
    jsonFile(paths.release),
    jsonFile(paths.thresholds),
    readFile(paths.preprocessingReference),
    readFile(paths.preprocessingInput),
    readFile(paths.expectedTensor),
    readFile(paths.modelInput),
    readFile(paths.expectedLogits),
    readFile(paths.expectedProbabilities),
  ]);

  if (model.byteLength < 1 || model.byteLength > MODEL_MAX_BYTES) {
    throw new Error(`model.onnx must be between 1 and ${MODEL_MAX_BYTES} bytes.`);
  }
  if (preprocessingReference.byteLength < 1) {
    throw new Error("preprocessing-reference.py must not be empty.");
  }

  const release = parseReleaseSource(releaseValue);
  const labels = parseThresholds(thresholdsValue);
  const expectedTensorValues = floatArray(expectedTensor, "expected-tensor.f32", FLOAT_COUNT);
  const modelInput = floatArray(modelInputBuffer, "model-input.f32", FLOAT_COUNT);
  const expectedLogits = numberArray(
    jsonBuffer(expectedLogitsValue, paths.expectedLogits),
    "expected-logits.json",
    THORAXSCAN_LABELS.length,
  );
  const expectedProbabilities = numberArray(
    jsonBuffer(expectedProbabilitiesValue, paths.expectedProbabilities),
    "expected-probabilities.json",
    THORAXSCAN_LABELS.length,
  );

  const metadata = await sharp(preprocessingInput).metadata();
  if (metadata.format !== "png" || metadata.hasAlpha) {
    throw new Error("preprocessing-input.png must be a non-alpha PNG fixture.");
  }
  const decoded = await sharp(preprocessingInput)
    .toColourspace("srgb")
    .ensureAlpha(1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const actualTensor = preprocessRgba(
    new Uint8ClampedArray(
      decoded.data.buffer.slice(
        decoded.data.byteOffset,
        decoded.data.byteOffset + decoded.data.byteLength,
      ),
    ),
    decoded.info.width,
    decoded.info.height,
  );
  const actualTensorBytes = Buffer.from(
    actualTensor.buffer,
    actualTensor.byteOffset,
    actualTensor.byteLength,
  );
  const expectedTensorBytes = Buffer.from(
    expectedTensorValues.buffer,
    expectedTensorValues.byteOffset,
    expectedTensorValues.byteLength,
  );
  if (!actualTensorBytes.equals(expectedTensorBytes)) {
    throw new Error("Browser-contract preprocessing does not match expected-tensor.f32.");
  }

  const parity = await validateOnnx(model, modelInput, expectedLogits, expectedProbabilities);
  const browserProviders = await validateBrowserProviders(model, modelInput, expectedLogits);
  const modelSha256 = sha256(model);
  const modelPath = modelPathForSha256(modelSha256);
  const manifest = parseModelManifest({
    schemaVersion: 1,
    release: {
      id: release.releaseId,
      modelFamily: release.modelFamily,
      checkpoint: release.checkpoint,
      sourceVersion: release.sourceVersion,
      preprocessingVersion: release.preprocessingVersion,
      thresholdVersion: release.thresholdVersion,
    },
    artifact: {
      format: "onnx",
      opset: 17,
      externalData: false,
      sha256: modelSha256,
      byteSize: model.byteLength,
      path: modelPath,
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
    labels,
    postprocessing: {
      activation: "sigmoid",
      thresholdComparison: ">=",
      noFindingConflict: "suppress-when-abnormal",
      noMatch: "explicit",
    },
    validation: {
      preprocessingFixtureSha256: sha256(preprocessingInput),
      expectedTensorSha256: sha256(expectedTensor),
      modelInputSha256: sha256(modelInputBuffer),
      expectedLogitsSha256: sha256(expectedLogitsValue),
      expectedProbabilitiesSha256: sha256(expectedProbabilitiesValue),
      preprocessingReferenceSha256: sha256(preprocessingReference),
      ...parity,
      ...browserProviders,
    },
  });
  const manifestJson = canonicalJson(manifest);
  const bundleSha256 = sha256(manifestJson);

  return {
    directory,
    model,
    modelInput,
    manifest,
    manifestJson,
    bundleSha256,
    manifestPath: manifestPathForSha256(bundleSha256),
    validationSummary: {
      passed: true,
      validatedAt: new Date().toISOString(),
      ...parity,
      ...browserProviders,
    },
  };
}

function registryClient() {
  const url = process.env.MODEL_REGISTRY_SUPABASE_URL;
  const serviceRoleKey = process.env.MODEL_REGISTRY_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "MODEL_REGISTRY_SUPABASE_URL and MODEL_REGISTRY_SERVICE_ROLE_KEY are required.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function actor(options: Map<string, string>) {
  return options.get("actor") ?? process.env.MODEL_PUBLISHER_ACTOR ?? "";
}

function publicArtifactUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${MODEL_BUCKET}/${path}`;
}

async function verifyRemoteObject(url: string, expected: Buffer) {
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Unable to verify ${url}: HTTP ${response.status}.`);
  const actual = Buffer.from(await response.arrayBuffer());
  if (actual.byteLength !== expected.byteLength || sha256(actual) !== sha256(expected)) {
    throw new Error(`Existing immutable object at ${url} does not match local content.`);
  }
  return true;
}

function tusEndpoint(supabaseUrl: string) {
  const url = new URL(supabaseUrl);
  if (url.hostname.endsWith(".supabase.co")) {
    const project = url.hostname.slice(0, -".supabase.co".length);
    return `https://${project}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${url.origin}/storage/v1/upload/resumable`;
}

async function uploadModel(model: Buffer, path: string) {
  const url = process.env.MODEL_REGISTRY_SUPABASE_URL!;
  const serviceRoleKey = process.env.MODEL_REGISTRY_SERVICE_ROLE_KEY!;
  await new Promise<void>((resolveUpload, rejectUpload) => {
    const upload = new Upload(model, {
      endpoint: tusEndpoint(url),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "x-upsert": "false",
      },
      metadata: {
        bucketName: MODEL_BUCKET,
        objectName: path,
        contentType: "application/octet-stream",
        cacheControl: "31536000",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      onError: rejectUpload,
      onSuccess: () => resolveUpload(),
    });
    upload.start();
  });
}

async function ensureRemoteBundle(supabase: SupabaseClient, bundle: ValidatedBundle) {
  const url = process.env.MODEL_REGISTRY_SUPABASE_URL!;
  const modelUrl = publicArtifactUrl(url, bundle.manifest.artifact.path);
  if (!(await verifyRemoteObject(modelUrl, bundle.model))) {
    await uploadModel(bundle.model, bundle.manifest.artifact.path);
    await verifyRemoteObject(modelUrl, bundle.model);
  }

  const manifestBytes = Buffer.from(bundle.manifestJson);
  const manifestUrl = publicArtifactUrl(url, bundle.manifestPath);
  if (!(await verifyRemoteObject(manifestUrl, manifestBytes))) {
    const { error } = await supabase.storage.from(MODEL_BUCKET).upload(
      bundle.manifestPath,
      manifestBytes,
      {
        contentType: "application/json",
        cacheControl: "31536000",
        upsert: false,
      },
    );
    if (error) throw error;
    await verifyRemoteObject(manifestUrl, manifestBytes);
  }
}

async function smokeRemoteModel(manifest: ModelManifestV1) {
  const url = publicArtifactUrl(
    process.env.MODEL_REGISTRY_SUPABASE_URL!,
    manifest.artifact.path,
  );
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Remote model request failed with HTTP ${response.status}.`);
  const model = Buffer.from(await response.arrayBuffer());
  if (model.byteLength !== manifest.artifact.byteSize || sha256(model) !== manifest.artifact.sha256) {
    throw new Error("Remote model integrity verification failed.");
  }
  const ort = await import("onnxruntime-web");
  const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
  try {
    const tensor = new ort.Tensor("float32", new Float32Array(FLOAT_COUNT), [1, 1, 224, 224]);
    const outputs = await session.run({ input: tensor }, ["logits"]);
    const logits = Array.from(outputs.logits.data as ArrayLike<number>);
    if (logits.length !== 14 || logits.some((value) => !Number.isFinite(value))) {
      throw new Error("Remote model smoke inference returned invalid logits.");
    }
  } finally {
    session.release();
  }
}

async function smokeBrowserModel(manifest: ModelManifestV1) {
  const { chromium } = await import("playwright");
  const ortDistribution = resolve("node_modules/onnxruntime-web/dist");
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (requestUrl.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end("<!doctype html><title>ThoraxScan model smoke</title>");
        return;
      }
      const fileName = requestUrl.pathname.slice(1);
      if (!/^[A-Za-z0-9._-]+$/.test(fileName)) {
        response.writeHead(404).end();
        return;
      }
      const bytes = await readFile(resolve(ortDistribution, fileName));
      response.writeHead(200, {
        "content-type": fileName.endsWith(".wasm")
          ? "application/wasm"
          : "text/javascript; charset=utf-8",
        "cross-origin-opener-policy": "same-origin",
        "cross-origin-embedder-policy": "require-corp",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Browser smoke server did not receive a TCP port.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(baseUrl);
    await page.addScriptTag({ path: resolve(ortDistribution, "ort.min.js") });
    const result = await page.evaluate(
      async ({ artifactUrl, wasmBaseUrl }) => {
        const browserWindow = window as typeof window & {
          ort: {
            env: { wasm: { wasmPaths: string; numThreads: number } };
            Tensor: new (
              type: "float32",
              data: Float32Array,
              dimensions: number[],
            ) => unknown;
            InferenceSession: {
              create(
                model: ArrayBuffer,
                options: { executionProviders: string[] },
              ): Promise<{
                run(feeds: Record<string, unknown>): Promise<Record<string, { data: ArrayLike<number> }>>;
                release(): Promise<void>;
              }>;
            };
          };
        };
        browserWindow.ort.env.wasm.wasmPaths = `${wasmBaseUrl}/`;
        browserWindow.ort.env.wasm.numThreads = 1;
        const response = await fetch(artifactUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`Model download failed with HTTP ${response.status}.`);
        const session = await browserWindow.ort.InferenceSession.create(
          await response.arrayBuffer(),
          { executionProviders: ["wasm"] },
        );
        try {
          const input = new browserWindow.ort.Tensor(
            "float32",
            new Float32Array(224 * 224),
            [1, 1, 224, 224],
          );
          const outputs = await session.run({ input });
          const logits = Array.from(outputs.logits?.data ?? []);
          return { count: logits.length, finite: logits.every(Number.isFinite) };
        } finally {
          await session.release();
        }
      },
      {
        artifactUrl: publicArtifactUrl(
          process.env.MODEL_REGISTRY_SUPABASE_URL!,
          manifest.artifact.path,
        ),
        wasmBaseUrl: baseUrl,
      },
    );
    if (result.count !== 14 || !result.finite) {
      throw new Error("Browser smoke inference returned invalid logits.");
    }
  } finally {
    await browser.close();
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }
}

async function status(supabase: SupabaseClient) {
  const { data: slot, error: slotError } = await supabase
    .from("model_slots")
    .select("slot, active_model_release_id, revision, activated_by, activated_at")
    .eq("slot", "thoraxscan-classifier")
    .single();
  if (slotError) throw slotError;

  let release = null;
  if (slot.active_model_release_id !== null) {
    const { data, error } = await supabase
      .from("model_releases")
      .select("id, release_id, bundle_sha256, manifest_path, manifest, registered_at")
      .eq("id", slot.active_model_release_id)
      .single();
    if (error) throw error;
    release = data;
  }
  return { slot, release };
}

async function stage(options: Map<string, string>) {
  const publisher = actor(options);
  if (!publisher) throw new Error("--actor or MODEL_PUBLISHER_ACTOR is required.");
  const bundle = await validateBundle(requiredOption(options, "bundle"));
  const supabase = registryClient();
  await ensureRemoteBundle(supabase, bundle);
  await smokeRemoteModel(bundle.manifest);

  const { data, error } = await supabase.rpc("register_model_release", {
    target_release_id: bundle.manifest.release.id,
    target_model_sha256: bundle.manifest.artifact.sha256,
    target_bundle_sha256: bundle.bundleSha256,
    target_model_byte_size: bundle.manifest.artifact.byteSize,
    target_model_path: bundle.manifest.artifact.path,
    target_manifest_path: bundle.manifestPath,
    target_manifest: bundle.manifest,
    target_validation_summary: bundle.validationSummary,
    actor: publisher,
  });
  if (error) throw error;
  return { modelReleaseId: data, releaseId: bundle.manifest.release.id, bundleSha256: bundle.bundleSha256 };
}

async function releaseByName(supabase: SupabaseClient, releaseId: string) {
  const { data, error } = await supabase
    .from("model_releases")
    .select("id, release_id, manifest")
    .eq("release_id", releaseId)
    .single();
  if (error) throw error;
  return { id: data.id as number, releaseId: data.release_id as string, manifest: parseModelManifest(data.manifest) };
}

async function activate(options: Map<string, string>, rollback: boolean) {
  const publisher = actor(options);
  if (!publisher) throw new Error("--actor or MODEL_PUBLISHER_ACTOR is required.");
  const releaseId = requiredOption(options, rollback ? "to" : "release");
  const expectedRevision = Number(requiredOption(options, "expected-revision"));
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("--expected-revision must be a non-negative integer.");
  }
  const reason = requiredOption(options, "reason");
  const supabase = registryClient();
  const before = await status(supabase);
  const target = await releaseByName(supabase, releaseId);
  await smokeRemoteModel(target.manifest);
  await smokeBrowserModel(target.manifest);

  const { data, error } = await supabase.rpc("activate_model_release", {
    target_model_release_id: target.id,
    expected_revision: expectedRevision,
    actor: publisher,
    reason,
  });
  if (error) throw error;
  const activation = Array.isArray(data) ? data[0] : data;

  try {
    const after = await status(supabase);
    if (after.release?.release_id !== releaseId) {
      throw new Error("Active model read-back did not return the requested release.");
    }
    const activeManifest = parseModelManifest(after.release.manifest);
    await smokeRemoteModel(activeManifest);
    await smokeBrowserModel(activeManifest);
    return after;
  } catch (postActivationError) {
    const previousId = before.slot.active_model_release_id as number | null;
    if (activation?.revision !== undefined) {
      const { error: rollbackError } = await supabase.rpc("activate_model_release", {
        target_model_release_id: previousId,
        expected_revision: activation.revision,
        actor: publisher,
        reason: `Automatic rollback after failed activation of ${releaseId}`,
      });
      if (rollbackError) {
        throw new AggregateError(
          [postActivationError, rollbackError],
          "Activation verification and automatic rollback both failed.",
        );
      }
    }
    throw postActivationError;
  }
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  let result: unknown;
  if (command === "validate") {
    const bundle = await validateBundle(requiredOption(options, "bundle"));
    result = {
      directory: bundle.directory,
      releaseId: bundle.manifest.release.id,
      modelSha256: bundle.manifest.artifact.sha256,
      bundleSha256: bundle.bundleSha256,
      validation: bundle.validationSummary,
    };
  } else if (command === "stage") {
    result = await stage(options);
  } else if (command === "status") {
    result = await status(registryClient());
  } else if (command === "activate") {
    result = await activate(options, false);
  } else if (command === "rollback") {
    result = await activate(options, true);
  } else {
    usage();
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Model release command failed: ${message}\n`);
  process.exitCode = 1;
});
