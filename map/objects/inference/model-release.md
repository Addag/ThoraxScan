---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Model release

An immutable registered ONNX candidate stored as `public.model_releases` with content-addressed artifact and manifest paths.

## Why this shape

Registration separates validated candidates from activation so publishing cannot silently change the model used by an analysis.

## Shape

The row fixes one classifier slot, contract version 1 or 2, release/model/bundle identifiers, sizes and paths, manifest, passing validation summary, actor, and timestamp. V2 bundles include the validated attention output descriptor and parity evidence. Update and delete triggers make registered rows immutable. The public `model-artifacts` bucket holds the content-addressed objects.

## Connected to

May be selected by [Active model slot](active-model-slot.md); its manifest is [Model manifest and configuration](model-manifest-configuration.md).

## If you change this

### Hits

- Registry migration, publisher CLI, Storage layout, activation, and active-release resolution.

### Does not hit

- Student AI analysis, saved analysis records, or feedback release. V2 heatmap output is validated at release time and persisted by the separate activity-analysis contract.

## Surfaces

Written only by service-role publisher operations; candidate rows are not readable through the authenticated Data API.

## See

[Registry migration](<../../../supabase/migrations/20260824081329_replaceable_model_foundation.sql:1>) and [V2 contract migration](<../../../supabase/migrations/20260922163225_attention_contract_hardening.sql:1>)
