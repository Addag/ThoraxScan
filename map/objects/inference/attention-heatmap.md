---
node_type: object
status: live
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Attention heatmap

Validated V2 releases expose global, class-agnostic 7x7 attention rollout.
V1 remains unavailable. Relative attention does not localize disease or provide
diagnostic evidence.

Deployment status: The project owner reports (2026-10-18) that hosted production runs the app with the Learning Mode possible tier and release `squeezevit-v5-kd-cardio042-possible85-20261017.1`. This repository holds no production registry snapshot, so the release ID and revision are not independently verified.

Learning Mode keeps the map and object URL in browser memory and revokes the URL
on replacement/unmount. Activity completion persists exactly 49 normalized values
with method and normalization metadata. Ready rows are immutable. Students receive
maps only after submission and feedback release. Approved Professors require
workspace access through a separate heatmap RPC. Direct analysis table reads remain
revoked. There is no saved-map history route.

The component draws a canvas overlay: the 49 values are bilinearly interpolated
between patch centers (display only, `upsampleAttention`) and colored with the
blue-to-red `ATTENTION_RAMP` in [attention.ts](../../../src/lib/inference/attention.ts),
which also feeds the legend. It has a toggle, native keyboard opacity slider,
legend and expandable numeric table of the raw 7x7 values. The PDF guide's
inline script copies the ramp and interpolation; keep them in sync. Rollback to V1 affects new inference only; existing
V2 analyses retain their maps.

Sources: [component](../../../src/components/attention-heatmap.tsx),
[runtime](../../../src/lib/inference/runtime.ts),
[authorized projections](../../../src/lib/activity-ai/server.ts),
[database contract](../../../supabase/migrations/20260922163225_attention_contract_hardening.sql),
[SqueezeViT exporter](../../../model-export/export_squeezevit.py),
[FastViT exporter](../../../model-export/export_fastvit.py) (rollout over its 2 stage-4 global attention blocks),
[release operations](../../../docs/model-releases.md).
