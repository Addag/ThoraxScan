import type { SupabaseClient } from "@supabase/supabase-js";
import type * as Ort from "onnxruntime-web";

import { createClient } from "@/lib/supabase/client";

import {
  MODEL_BUCKET,
  type ActiveModelRelease,
  parseModelManifest,
} from "./contract";
import { InferenceError, asInferenceError } from "./errors";
import { postprocessLogits, type PostprocessedPrediction } from "./postprocess";
import { preprocessImage } from "./preprocess";

import { readyAttention, UNAVAILABLE_ATTENTION, type AttentionHeatmap } from "./attention";

type ExecutionProvider = "webgpu" | "wasm";
type OrtModule = typeof Ort;

interface CachedSession {
  key: string;
  promise: Promise<{ ort: OrtModule; session: Ort.InferenceSession }>;
  ready: boolean;
  inUse: number;
  lastUsed: number;
}

interface ActiveReleaseRow {
  model_release_id: number;
  release_id: string;
  bundle_sha256: string;
  manifest_path: string;
  manifest: unknown;
  revision: number;
}

export interface InferenceResult extends PostprocessedPrediction {
  releaseId: string;
  modelReleaseId: number;
  modelSha256: string;
  bundleSha256: string;
  preprocessingVersion: string;
  thresholdVersion: string;
  manifestVersion: 1 | 2;
  attention?: AttentionHeatmap;
  executionProvider: ExecutionProvider;
  applicationBuild: string;
}

const sessions = new Map<string, CachedSession>();
const webGpuDisabledBundles = new Set<string>();

function configureOrt(ort: OrtModule) {
  // Avoid the proxy worker: its URL resolution is unreliable in bundled
  // Next.js clients and it also requires cross-origin isolation for threads.
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = {
    mjs: "/ort/1.27.0/ort-wasm-simd-threaded.mjs",
    wasm: "/ort/1.27.0/ort-wasm-simd-threaded.wasm",
  };
  ort.env.wasm.numThreads = 1;
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export async function resolveActiveModel(
  supabase: SupabaseClient = createClient(),
): Promise<ActiveModelRelease> {
  const { data, error } = await supabase.rpc("get_active_model_release").maybeSingle();
  if (error) {
    throw new InferenceError("NO_ACTIVE_MODEL", "The active model could not be resolved.", error);
  }
  if (!data) {
    throw new InferenceError("NO_ACTIVE_MODEL", "No active model release is available.");
  }

  const row = data as ActiveReleaseRow;
  if (
    !isSafeInteger(row.model_release_id) ||
    !isSafeInteger(row.revision) ||
    typeof row.release_id !== "string" ||
    typeof row.bundle_sha256 !== "string" ||
    typeof row.manifest_path !== "string"
  ) {
    throw new InferenceError("UNSUPPORTED_MANIFEST", "The active model record is invalid.");
  }

  const manifest = parseModelManifest(row.manifest);
  if (
    manifest.release.id !== row.release_id ||
    !/^[0-9a-f]{64}$/.test(row.bundle_sha256) ||
    row.manifest_path !== `bundles/sha256/${row.bundle_sha256}/manifest.json`
  ) {
    throw new InferenceError(
      "UNSUPPORTED_MANIFEST",
      "The active model registry record does not match its manifest.",
    );
  }

  const { data: publicUrl } = supabase.storage
    .from(MODEL_BUCKET)
    .getPublicUrl(manifest.artifact.path);

  return {
    modelReleaseId: row.model_release_id,
    releaseId: row.release_id,
    bundleSha256: row.bundle_sha256,
    manifestPath: row.manifest_path,
    artifactUrl: publicUrl.publicUrl,
    revision: row.revision,
    manifest,
  };
}

async function sha256Hex(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function fetchVerifiedModel(
  release: ActiveModelRelease,
  signal?: AbortSignal,
) {
  const response = await fetch(release.artifactUrl, { signal, cache: "force-cache" });
  if (!response.ok) {
    throw new InferenceError(
      "MODEL_LOAD_FAILED",
      `The model artifact request failed with status ${response.status}.`,
    );
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== release.manifest.artifact.byteSize) {
    throw new InferenceError(
      "ARTIFACT_INTEGRITY_FAILED",
      "The model artifact size does not match its manifest.",
    );
  }
  if ((await sha256Hex(bytes)) !== release.manifest.artifact.sha256) {
    throw new InferenceError(
      "ARTIFACT_INTEGRITY_FAILED",
      "The model artifact hash does not match its manifest.",
    );
  }
  return bytes;
}

function canUseWebGpu() {
  return (
    typeof navigator !== "undefined" &&
    Boolean((navigator as Navigator & { gpu?: unknown }).gpu)
  );
}

export async function loadModelSession(
  release: ActiveModelRelease,
  provider: ExecutionProvider,
): Promise<{ ort: OrtModule; session: Ort.InferenceSession }> {
  const bytes = await fetchVerifiedModel(release);
  try {
    if (provider === "webgpu") {
      const ort = (await import("onnxruntime-web/webgpu")) as OrtModule;
      configureOrt(ort);
      const session = await ort.InferenceSession.create(bytes, {
        executionProviders: ["webgpu"],
      });
      return { ort, session };
    }

    const ort = await import("onnxruntime-web");
    configureOrt(ort);
    const session = await ort.InferenceSession.create(bytes, {
      executionProviders: ["wasm"],
    });
    return { ort, session };
  } catch (error) {
    throw asInferenceError(error, "MODEL_LOAD_FAILED", "The model session could not be created.");
  }
}

function evictIdleSessions() {
  if (sessions.size <= 2) return;
  const candidates = [...sessions.values()]
    .filter((entry) => entry.ready && entry.inUse === 0)
    .sort((left, right) => left.lastUsed - right.lastUsed);

  while (sessions.size > 2 && candidates.length > 0) {
    const entry = candidates.shift();
    if (!entry) break;
    sessions.delete(entry.key);
    void entry.promise.then(({ session }) => session.release()).catch(() => undefined);
  }
}

export async function acquireModelSession(
  release: ActiveModelRelease,
  forceWasm = false,
) {
  let provider: ExecutionProvider =
    !forceWasm &&
    canUseWebGpu() &&
    release.manifest.validation.webGpuEnabled &&
    !webGpuDisabledBundles.has(release.bundleSha256)
      ? "webgpu"
      : "wasm";
  let key = `${release.bundleSha256}:${provider}`;
  let entry = sessions.get(key);

  if (!entry) {
    const promise = loadModelSession(release, provider);
    entry = { key, promise, ready: false, inUse: 0, lastUsed: Date.now() };
    sessions.set(key, entry);
    try {
      await promise;
      entry.ready = true;
    } catch (error) {
      sessions.delete(key);
      if (provider !== "webgpu") throw error;
      webGpuDisabledBundles.add(release.bundleSha256);
      provider = "wasm";
      key = `${release.bundleSha256}:${provider}`;
      entry = sessions.get(key);
      if (!entry) {
        entry = {
          key,
          promise: loadModelSession(release, provider),
          ready: false,
          inUse: 0,
          lastUsed: Date.now(),
        };
        sessions.set(key, entry);
      }
    }
  }

  const loaded = await entry.promise;
  entry.ready = true;
  entry.inUse += 1;
  entry.lastUsed = Date.now();
  evictIdleSessions();

  return {
    ...loaded,
    provider,
    release() {
      entry!.inUse = Math.max(0, entry!.inUse - 1);
      entry!.lastUsed = Date.now();
      evictIdleSessions();
    },
  };
}

class WebGpuExecutionError extends Error {
  constructor(readonly cause: unknown) {
    super("WebGPU inference failed.");
  }
}

function withAbort<T>(promise: Promise<T>, signal?: AbortSignal) {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  }
  return new Promise<T>((resolvePromise, rejectPromise) => {
    const abort = () => rejectPromise(new DOMException("The operation was aborted.", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolvePromise, rejectPromise).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}

export async function runModelInference(
  release: ActiveModelRelease,
  tensorData: Float32Array,
  forceWasm = false,
) {
  const handle = await acquireModelSession(release, forceWasm);
  try {
    const tensor = new handle.ort.Tensor("float32", tensorData, [1, 1, 224, 224]);
    let outputs: Awaited<ReturnType<Ort.InferenceSession["run"]>>;
    try {
      outputs = await handle.session.run(
        { [release.manifest.input.name]: tensor },
        release.manifest.schemaVersion === 2 ? ["logits", "attention_map"] : ["logits"],
      );
    } catch (error) {
      if (handle.provider === "webgpu") throw new WebGpuExecutionError(error);
      throw asInferenceError(error, "MODEL_LOAD_FAILED", "Model execution failed.");
    }
    const output = outputs[release.manifest.output.name];
    if (!output || output.type !== "float32" || output.dims.join(",") !== "1,14" || output.size !== release.manifest.labels.length || Array.from(output.data as ArrayLike<number>).some(value => !Number.isFinite(value))) {
      throw new InferenceError("INVALID_OUTPUT", "The model returned an invalid logits tensor.");
    }
    let attention: AttentionHeatmap = UNAVAILABLE_ATTENTION;
    if (release.manifest.schemaVersion === 2) {
      const map = outputs.attention_map;
      if (!map || map.type !== "float32" || map.dims.join(",") !== "1,1,7,7") {
        throw new InferenceError("INVALID_OUTPUT", "The model returned invalid attention dimensions.");
      }
      attention = readyAttention(Array.from(map.data as ArrayLike<number>));
    }
    return {
      attention,
      logits: Array.from(output.data as ArrayLike<number>),
      provider: handle.provider,
    };
  } finally {
    handle.release();
  }
}

export async function analyzeImage(
  blob: Blob,
  options: { signal?: AbortSignal; supabase?: SupabaseClient } = {},
): Promise<InferenceResult> {
  const [release, tensorData] = await Promise.all([
    resolveActiveModel(options.supabase),
    preprocessImage(blob, options.signal),
  ]);
  if (options.signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");

  let inference: Awaited<ReturnType<typeof runModelInference>>;
  try {
    inference = await withAbort(runModelInference(release, tensorData), options.signal);
  } catch (error) {
    if (!(error instanceof WebGpuExecutionError)) throw error;
    webGpuDisabledBundles.add(release.bundleSha256);
    inference = await withAbort(
      runModelInference(release, tensorData, true),
      options.signal,
    );
  }

  const prediction = postprocessLogits(inference.logits, release.manifest);
  return {
    ...prediction,
    releaseId: release.releaseId,
    modelReleaseId: release.modelReleaseId,
    modelSha256: release.manifest.artifact.sha256,
    bundleSha256: release.bundleSha256,
    preprocessingVersion: release.manifest.release.preprocessingVersion,
    thresholdVersion: release.manifest.release.thresholdVersion,
    manifestVersion: release.manifest.schemaVersion,
    attention: inference.attention,
    executionProvider: inference.provider,
    applicationBuild: process.env.NEXT_PUBLIC_APP_BUILD ?? "development",
  };
}

export function resetInferenceCachesForTests() {
  for (const entry of sessions.values()) {
    void entry.promise.then(({ session }) => session.release()).catch(() => undefined);
  }
  sessions.clear();
  webGpuDisabledBundles.clear();
}
