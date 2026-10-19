---
node_type: process
universe: live
status: verified
audited: 2026-09-17
snapshot: main @ a96a291
---

# Model activation

Inactive release plus expected revision → locked pointer change and history event → verified active release.

## Steps

1. The CLI resolves and smoke-checks the requested registered release ([activation command](../../scripts/model-release.ts#L818)).
2. The [activation RPC](../../supabase/migrations/20260824081329_replaceable_model_foundation.sql#L204) locks the one slot, rejects a stale expected revision, changes the pointer, increments its revision, and appends an event. Since [the 2026-10-17 fix](../../supabase/migrations/20261017120000_activation_conflict_not_retryable.sql) a stale revision raises `PT409`, which PostgREST returns as HTTP 409 without retrying. The earlier `40001` code was retried indefinitely and pinned hosted CPU.
3. The CLI reads the pointer back and runs Node and headless-Chromium WASM smoke inference ([browser smoke](../../scripts/model-release.ts#L660), [read-back](../../scripts/model-release.ts#L842)).
4. A failed post-check records a compensating activation that restores the previous pointer or clears an initially empty slot ([automatic restoration](../../scripts/model-release.ts#L851)).

## Consumes

- [Model release](../objects/inference/model-release.md)
- [Active model slot](../objects/inference/active-model-slot.md)

## Produces

- A new active pointer revision and append-only activation event.

## If you change this

### Hits

- Expected-revision semantics, locking, activation audit, CLI read-back, browser smoke, and automatic restoration.

### Does not hit

- An inference already in flight, which pins its resolved release.

## See

[Activation command](../../scripts/model-release.ts#L818)
