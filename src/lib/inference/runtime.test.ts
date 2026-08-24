import type { ActiveModelRelease } from "./contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireModelSession,
  fetchVerifiedModel,
  resetInferenceCachesForTests,
  resolveActiveModel,
} from "./runtime";
import { createTestManifest } from "./test-manifest";

const ortMocks = vi.hoisted(() => {
  const release = vi.fn();
  const run = vi.fn();
  const create = vi.fn<
    (model: unknown, options?: unknown) => Promise<{ run: typeof run; release: typeof release }>
  >(async () => ({ run, release }));
  class Tensor {
    constructor(
      readonly type: string,
      readonly data: Float32Array,
      readonly dimensions: number[],
    ) {}
  }
  return { create, release, run, Tensor };
});

vi.mock("onnxruntime-web", () => ({
  InferenceSession: { create: ortMocks.create },
  Tensor: ortMocks.Tensor,
}));
vi.mock("onnxruntime-web/webgpu", () => ({
  InferenceSession: { create: ortMocks.create },
  Tensor: ortMocks.Tensor,
}));

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function releaseFor(bytes: Uint8Array, bundle = "b".repeat(64)) {
  const modelSha256 = await sha256(bytes);
  const manifest = createTestManifest({
    artifact: {
      format: "onnx",
      opset: 17,
      externalData: false,
      sha256: modelSha256,
      byteSize: bytes.byteLength,
      path: `artifacts/sha256/${modelSha256}/model.onnx`,
    },
  });
  return {
    modelReleaseId: 1,
    releaseId: manifest.release.id,
    bundleSha256: bundle,
    manifestPath: `bundles/sha256/${bundle}/manifest.json`,
    artifactUrl: "https://example.test/model.onnx",
    revision: 1,
    manifest,
  } satisfies ActiveModelRelease;
}

describe("model session loading", () => {
  beforeEach(() => {
    ortMocks.create.mockClear();
    ortMocks.create.mockImplementation(async () => ({
      run: ortMocks.run,
      release: ortMocks.release,
    }));
    ortMocks.release.mockClear();
  });

  afterEach(() => {
    resetInferenceCachesForTests();
    vi.unstubAllGlobals();
  });

  it("verifies model bytes and rejects tampering before session creation", async () => {
    const expected = new Uint8Array([1, 2, 3, 4]);
    const activeRelease = await releaseFor(expected);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(expected)));
    expect(new Uint8Array(await fetchVerifiedModel(activeRelease))).toEqual(expected);

    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([9, 9, 9, 9]))));
    await expect(fetchVerifiedModel(activeRelease)).rejects.toMatchObject({
      code: "ARTIFACT_INTEGRITY_FAILED",
    });
  });

  it("reuses a session for the same bundle", async () => {
    const bytes = new Uint8Array([5, 6, 7]);
    const activeRelease = await releaseFor(bytes);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(bytes)));

    const first = await acquireModelSession(activeRelease, true);
    const second = await acquireModelSession(activeRelease, true);
    expect(ortMocks.create).toHaveBeenCalledTimes(1);
    first.release();
    second.release();
  });

  it("falls back to WASM when a parity-approved WebGPU session cannot load", async () => {
    const bytes = new Uint8Array([11, 12, 13]);
    const activeRelease = await releaseFor(bytes);
    activeRelease.manifest.validation.webGpuEnabled = true;
    activeRelease.manifest.validation.webGpuMaxAbsoluteDifference = 0.0005;
    vi.stubGlobal("navigator", { gpu: {} });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(bytes)));
    ortMocks.create.mockRejectedValueOnce(new Error("WebGPU unavailable"));

    const handle = await acquireModelSession(activeRelease);
    expect(handle.provider).toBe("wasm");
    expect(ortMocks.create).toHaveBeenCalledTimes(2);
    expect(ortMocks.create.mock.calls[1]?.[1]).toMatchObject({
      executionProviders: ["wasm"],
    });
    handle.release();
  });

  it("evicts only idle sessions when a third bundle is loaded", async () => {
    const bytes = new Uint8Array([8, 9, 10]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(bytes)));

    for (const bundle of ["1".repeat(64), "2".repeat(64), "3".repeat(64)]) {
      const handle = await acquireModelSession(await releaseFor(bytes, bundle), true);
      handle.release();
    }

    await vi.waitFor(() => expect(ortMocks.release).toHaveBeenCalledTimes(1));
  });

  it("resolves the active pointer again between runs", async () => {
    const firstManifest = createTestManifest();
    const secondManifest = createTestManifest({
      release: { ...firstManifest.release, id: "test-release-2" },
    });
    const rows = [
      {
        model_release_id: 1,
        release_id: firstManifest.release.id,
        bundle_sha256: "1".repeat(64),
        manifest_path: `bundles/sha256/${"1".repeat(64)}/manifest.json`,
        manifest: firstManifest,
        revision: 1,
      },
      {
        model_release_id: 2,
        release_id: secondManifest.release.id,
        bundle_sha256: "2".repeat(64),
        manifest_path: `bundles/sha256/${"2".repeat(64)}/manifest.json`,
        manifest: secondManifest,
        revision: 2,
      },
    ];
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: rows[0], error: null })
      .mockResolvedValueOnce({ data: rows[1], error: null });
    const supabase = {
      rpc: vi.fn(() => ({ maybeSingle })),
      storage: {
        from: vi.fn(() => ({
          getPublicUrl: vi.fn((path: string) => ({
            data: { publicUrl: `https://example.test/${path}` },
          })),
        })),
      },
    } as unknown as SupabaseClient;

    expect((await resolveActiveModel(supabase)).releaseId).toBe("test-release");
    expect((await resolveActiveModel(supabase)).releaseId).toBe("test-release-2");
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });
});
