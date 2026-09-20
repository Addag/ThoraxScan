---
node_type: object
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Transient prediction result

`InferenceResult` is an in-memory prediction with label decisions and enough release provenance to identify the model that produced it. Activity analysis adapts it to a fixed probability vector before the database independently derives thresholded findings.

## Why this shape

An analysis remains attributable even if the environment's active pointer changes after that run starts.

## Shape

It contains all label probabilities and thresholds, selected findings or explicit no-match state, release and model identifiers/hashes, preprocessing and threshold versions, provider, manifest version, and application build.

## Connected to

Produced by [Browser inference runtime](browser-inference-runtime.md) using [Model manifest and configuration](model-manifest-configuration.md).

## If you change this

### Hits

- Postprocessing, provenance consumers, future inference UI, and any future persistence schema.

### Does not hit

- Immutable saved activity analysis records; the result remains transient until the persistence adapter submits its probabilities and provenance.

## Surfaces

Returned by the exported `analyzeImage` library function and consumed by the Student/Professor activity analysis components through the persistence adapter.

## See

[Inference result](../../../src/lib/inference/runtime.ts#L35)
