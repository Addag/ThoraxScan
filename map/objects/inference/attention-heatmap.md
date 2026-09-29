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

Deployment status (2026-09-29): the project owner reports that V2 is currently
deployed. The repository does not contain a production registry snapshot, so the
active release ID and activation revision are not independently verified here.

Learning Mode keeps the map and object URL in browser memory and revokes the URL
on replacement/unmount. Activity completion persists exactly 49 normalized values
with method and normalization metadata. Ready rows are immutable. Students receive
maps only after submission and feedback release. Approved Professors require
workspace access through a separate heatmap RPC. Direct analysis table reads remain
revoked. There is no saved-map history route.

The SVG component has a toggle, native keyboard opacity slider, sequential legend
and expandable numeric table. Rollback to V1 affects new inference only; existing
V2 analyses retain their maps.

Sources: [component](../../../src/components/attention-heatmap.tsx),
[runtime](../../../src/lib/inference/runtime.ts),
[authorized projections](../../../src/lib/activity-ai/server.ts),
[database contract](../../../supabase/migrations/20260922163225_attention_contract_hardening.sql),
[exporter](../../../model-export/export_squeezevit.py),
[release operations](../../../docs/model-releases.md).
