---
node_type: object
universe: live
status: verified
audited: 2026-10-31
snapshot: main @ 46c18c1 + working tree
---

# Active model slot

`public.model_slots` contains the one active pointer named `thoraxscan-classifier` in each Supabase instance.

## Why this shape

One pointer per database makes local and hosted production activation independent without an environment discriminator in the schema.

## Shape

The seeded row holds a nullable active release foreign key, monotonically increasing revision, activation actor, and time. Activation history is append-only in `model_activation_events`.

## Hosted production history

From `model_activation_events` (joined to `model_releases.release_id`), read by the owner in the Supabase SQL Editor on 2026-10-31. Times are UTC.

| Revision | Activated (UTC) | Release | Reason |
|---|---|---|---|
| 1 | 2026-09-17 03:28 | `squeezevit-official-valid-20260916.1` | Initial production activation of official CheXpert retrained model |
| 2 | 2026-09-26 00:37 | `squeezevit-attention-v2-20260922.1` | Production V2 attention heatmap release |
| 3 | 2026-10-17 07:27 | `fastvit-retrain-v3-attention-20261017.1` | Switch hosted to FastViT-SA12 retrain v3 |
| 4 | 2026-10-17 07:27 | `fastvit-retrain-v3-attention-20261016.1` | Switch to FastViT-SA12 retrain v3 |
| 5 | 2026-10-17 07:34 | `fastvit-retrain-v3-attention-20261017.1` | FastViT v3: 80% sensitivity thresholds for competition labels |
| 6 | 2026-10-17 13:23 | `squeezevit-retrain-v5-kd-attention-20261017.1` | Retrain v5: SqueezeViT distilled from FastViT v4 |
| 7 | 2026-10-17 13:30 | `squeezevit-retrain-v5-kd-attention-cardio042-20261017.1` | v5: Cardiomegaly threshold 0.42 |
| 8 | 2026-10-17 22:46 | `squeezevit-v5-kd-cardio042-possible85-20261017.1` | Learning Mode possible tier |
| 9 | 2026-10-21 09:05 | `fastvit-retrain-v3-attention-20261016.2` | Enable WebGPU |
| 10 | 2026-10-29 14:48 | `squeezevit-v5-kd-cam-possible85-20261029.1` | Per-finding heatmaps (CAM) |
| 11 | 2026-10-29 17:14 | `squeezevit-v6-nih-cam-possible85-20261030.1` | v6 CheXpert+NIH retrain with per-finding heatmaps |
| 12 | 2026-10-30 06:13 | `tinyvit-v7-nih-cam-possible85-20261030.1` | v7 TinyViT-11M |
| 13 | 2026-10-30 11:21 | `tinyvit-v7-nih-cam-ecm-possible85-sr320-20261030.1` | Add ECM rule and short-side-320 resize |

Revision 9 moved production from SqueezeViT v5 back to FastViT v3 (`.2` is the WebGPU-enabled copy) until revision 10. Revisions 3 and 4 were 3 ms apart with a release-ID actor, likely a retried activation. Rollback target from revision 13: `tinyvit-v7-nih-cam-possible85-20261030.1`. Re-read with the query in [model activation](../../processes/model-activation.md).

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
