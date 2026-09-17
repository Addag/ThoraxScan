---
node_type: process
universe: live
status: verified
audited: 2026-09-17
snapshot: main @ a96a291
---

# Model rollback

Previously registered release plus current revision → ordinary audited activation back to that release.

## Steps

1. `model:rollback` requires the target release ID, current expected revision, actor, and reason, then enters the [shared activation path](../../scripts/model-release.ts#L818).
2. It uses the same remote preflight, locked activation RPC, revision increment, history event, read-back, and browser validation as forward activation ([command dispatch](../../scripts/model-release.ts#L889)).

## Consumes

- [Model release](../objects/inference/model-release.md)
- [Active model slot](../objects/inference/active-model-slot.md)

## Produces

- A new pointer revision selecting an older immutable release; history is preserved.

## If you change this

### Hits

- Activation semantics, audit history, operator recovery instructions, and smoke validation.

### Does not hit

- Release rows or Storage artifacts, which remain immutable.

## See

[Shared activation and rollback command](../../scripts/model-release.ts#L818)
