---
node_type: process
universe: live
status: verified
audited: 2026-09-17
snapshot: main @ a96a291
---

# Model staging

Validated local bundle → immutable Storage upload and remote smoke → inactive registered release.

## Steps

1. `model:stage` runs full local validation before creating a registry client ([staging command](../../scripts/model-release.ts#L785)).
2. It verifies each public content-addressed object, treating HTTP 404 or a structured HTTP 400 `NoSuchKey` response as absent; absent objects are uploaded without upsert and then reverified ([remote verification](../../scripts/model-release.ts#L556), [bundle upload](../../scripts/model-release.ts#L610)).
3. It downloads and smoke-runs the remote model, then calls the service-role-only registration RPC; the active slot is untouched ([remote smoke](../../scripts/model-release.ts#L635), [registration](../../scripts/model-release.ts#L793)).

## Consumes

- [Model release](../objects/inference/model-release.md)
- [Model manifest and configuration](../objects/inference/model-manifest-configuration.md)

## Produces

- An inactive immutable [Model release](../objects/inference/model-release.md)

## If you change this

### Hits

- Publisher credentials, Storage paths/cache metadata, missing-object response handling, resumable upload, remote validation, and registration RPC.

### Does not hit

- The [Active model slot](../objects/inference/active-model-slot.md).

## See

[Staging command](../../scripts/model-release.ts#L785)
