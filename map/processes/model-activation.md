---
node_type: process
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Model activation

Inactive release plus expected revision → locked pointer change and history event → verified active release.

## Steps

1. The CLI resolves and smoke-checks the requested registered release.
2. The activation RPC locks the one slot, rejects a stale expected revision, changes the pointer, increments its revision, and appends an event.
3. The CLI reads the pointer back and runs Node and headless-Chromium WASM smoke inference.
4. A failed post-check records a compensating activation that restores the previous pointer or clears an initially empty slot.

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

[Activation RPC](../../supabase/migrations/20260824081329_replaceable_model_foundation.sql#L204)
