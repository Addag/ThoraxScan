---
node_type: object
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Browser inference runtime

The inference library resolves the active release for each run, verifies model bytes, dynamically loads ONNX Runtime Web, and pins the selected release through that run.

## Why this shape

Runtime replacement must fail closed and must not silently use a cached older model when the active pointer changes.

## Shape

It attempts WebGPU and falls back to WASM on WebGPU load or execution failure, caches at most two sessions keyed by bundle and provider, protects loading/in-use sessions from eviction, and emits typed failures.

## Connected to

Consumes [Active model slot](active-model-slot.md), [Model manifest and configuration](model-manifest-configuration.md), and [Preprocessing tensor](preprocessing-tensor.md); produces [Transient prediction result](prediction-result.md) for [Student Learning Mode](../ui/student-learning-mode-surface.md) and the activity analysis browser boundary.

## If you change this

### Hits

- Active RPC shape, artifact integrity, ONNX Runtime bundling, provider fallback, session reuse, and inference result provenance.

### Does not hit

- Server-side image inference, saved analysis mutation, submissions, or heatmaps; only result metadata crosses the application write boundary.

## Surfaces

Exported application library and Vitest browser/runtime conformance suites.

## See

[Browser runtime](../../../src/lib/inference/runtime.ts#L54)
