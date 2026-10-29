---
node_type: object
universe: live
status: verified
audited: 2026-10-27
snapshot: main @ 76f6977 + working tree
---

# Browser inference runtime

The inference library resolves the active release for each run, verifies model bytes, dynamically loads ONNX Runtime Web, and pins the selected release through that run. Validated V2 releases also return a normalized 7 x 7 global attention map; V1 returns an unavailable attention status.

## Why this shape

Runtime replacement must fail closed and must not silently use a cached older model when the active pointer changes.

## Shape

It attempts WebGPU and falls back to WASM on WebGPU load or execution failure, caches at most two sessions keyed by bundle and provider, protects loading/in-use sessions from eviction, and emits typed failures.

ORT's `wasmPaths` is the folder prefix `/ort/1.27.0/`, not fixed file names, so each build loads its own binary; the WebGPU build needs the `.asyncify` file ([runtime.ts](<../../../src/lib/inference/runtime.ts:59>)).

## Connected to

Consumes [Active model slot](active-model-slot.md), [Model manifest and configuration](model-manifest-configuration.md), and [Preprocessing tensor](preprocessing-tensor.md); produces [Transient prediction result](prediction-result.md) for [Student Learning Mode](../ui/student-learning-mode-surface.md) and the activity analysis browser boundary.

## If you change this

### Hits

- Active RPC shape, artifact integrity, the `/ort/1.27.0/` asset folder (pinning the plain WASM files makes WebGPU sessions fail and silently fall back to WASM), ONNX Runtime bundling, provider fallback, session reuse, and inference result provenance.

### Does not hit

- Server-side image inference, direct analysis-table mutation, or submissions; the browser result, including an optional V2 or V3 heatmap, crosses the application write boundary only through the activity analysis adapter.

## Surfaces

Exported application library and Vitest browser/runtime conformance suites.

## See

[Browser runtime](../../../src/lib/inference/runtime.ts#L54)
