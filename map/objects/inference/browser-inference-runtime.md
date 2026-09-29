---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Browser inference runtime

The inference library resolves the active release for each run, verifies model bytes, dynamically loads ONNX Runtime Web, and pins the selected release through that run. Validated V2 releases also return a normalized 7 x 7 global attention map; V1 returns an unavailable attention status.

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

- Server-side image inference, direct analysis-table mutation, or submissions; the browser result, including an optional V2 attention map, crosses the application write boundary only through the activity analysis adapter.

## Surfaces

Exported application library and Vitest browser/runtime conformance suites.

## See

[Browser runtime](../../../src/lib/inference/runtime.ts#L54)
