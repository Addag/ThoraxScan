---
node_type: process
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Model staging

Validated local bundle → immutable Storage upload and remote smoke → inactive registered release.

## Steps

1. `model:stage` runs full local validation before creating a registry client.
2. It verifies existing content-addressed objects or uploads without upsert, using resumable upload for the ONNX artifact.
3. It downloads and smoke-runs the remote model, then calls the service-role-only registration RPC; the active slot is untouched.

## Consumes

- [Model release](../objects/inference/model-release.md)
- [Model manifest and configuration](../objects/inference/model-manifest-configuration.md)

## Produces

- An inactive immutable [Model release](../objects/inference/model-release.md)

## If you change this

### Hits

- Publisher credentials, Storage paths/cache metadata, resumable upload, remote validation, and registration RPC.

### Does not hit

- The [Active model slot](../objects/inference/active-model-slot.md).

## See

[Staging command](../../scripts/model-release.ts#L777)
