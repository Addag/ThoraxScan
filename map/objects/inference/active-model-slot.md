---
node_type: object
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Active model slot

`public.model_slots` contains the one active pointer named `thoraxscan-classifier` in each Supabase instance.

## Why this shape

One pointer per database makes local and hosted production activation independent without an environment discriminator in the schema.

## Shape

The seeded row holds a nullable active release foreign key, monotonically increasing revision, activation actor, and time. Activation history is append-only in `model_activation_events`.

## Connected to

Selects one [Model release](model-release.md) and is exposed to authenticated callers only through the narrow active-release RPC.

## If you change this

### Hits

- Compare-and-swap activation, rollback, runtime resolution, status output, and activation history.

### Does not hit

- Vercel environment selection or a future staging project's independent pointer.

## Surfaces

Service-role CLI mutates it; authenticated browser clients receive only the active descriptor through `get_active_model_release`.

## See

[Registry migration](../../../supabase/migrations/20260824081329_replaceable_model_foundation.sql#L59)
