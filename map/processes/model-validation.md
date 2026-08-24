---
node_type: process
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Model validation

Untracked release bundle → fixed-contract and parity checks → content-addressed manifest candidate.

## Steps

1. `model:validate` reads the required local artifact, metadata, thresholds, preprocessing source, and non-sensitive fixtures.
2. It rejects size, path, opset, external-data, label, threshold, tensor, finite-value, or contract violations.
3. It runs WASM parity, hashes the evidence and model, and emits the generated release and bundle identifiers without uploading.

## Consumes

- [Model manifest and configuration](../objects/inference/model-manifest-configuration.md)
- [Preprocessing tensor](../objects/inference/preprocessing-tensor.md)

## Produces

- A validated candidate description for [Model release](../objects/inference/model-release.md)

## If you change this

### Hits

- Bundle format, parity limits, ONNX compatibility gate, hashes, and staging.

### Does not hit

- Active production state.

## See

[Publisher validator](../../scripts/model-release.ts#L366)
