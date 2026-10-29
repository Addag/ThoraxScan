---
node_type: process
universe: live
status: verified
audited: 2026-09-17
snapshot: main @ a96a291
---

# Model validation

Untracked release bundle → fixed-contract and parity checks → content-addressed manifest candidate.

## Steps

1. `model:validate` reads the required local artifact, metadata, thresholds, preprocessing source, and non-sensitive fixtures through the [bundle validator](../../scripts/model-release.ts#L425).
2. It rejects size, path, opset, external-data, label, threshold, tensor, finite-value, or contract violations before constructing the manifest ([contract checks](../../scripts/model-release.ts#L475)).
3. It runs ONNX Runtime Web WASM parity and Chromium provider checks, hashes the evidence and model, and emits the generated release and bundle identifiers without uploading ([provider checks](../../scripts/model-release.ts#L273), [validation result](../../scripts/model-release.ts#L559)).

## Consumes

- [Model manifest and configuration](../objects/inference/model-manifest-configuration.md)
- [Preprocessing tensor](../objects/inference/preprocessing-tensor.md)

## Produces

- A validated candidate description for [Model release](../objects/inference/model-release.md)

## If you change this

### Hits

- Bundle format, parity limits, ONNX compatibility gate, Chromium harness loading, hashes, and staging.

### Does not hit

- Active production state.

## See

[Publisher validator](../../scripts/model-release.ts#L425)
