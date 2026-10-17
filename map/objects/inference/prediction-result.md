---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Transient prediction result

`InferenceResult` is an in-memory prediction with label decisions, release provenance, and an optional validated V2 attention map. Activity analysis adapts its fixed probability vector and optional map before the database independently derives thresholded findings.

## Why this shape

An analysis remains attributable even if the environment's active pointer changes after that run starts.

## Shape

It contains all label probabilities and thresholds, selected findings or explicit no-match state, `possibleFindings` (abnormal labels in `[possibleThreshold, threshold)`; empty without possible thresholds, never No Finding), release and model identifiers/hashes, preprocessing and threshold versions, provider, manifest version, application build, and either a transient 7 x 7 attention map or an unavailable status.

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
