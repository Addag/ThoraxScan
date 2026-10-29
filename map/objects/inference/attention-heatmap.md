---
node_type: object
status: live
audited: 2026-10-29
snapshot: main @ b71d5f3 + working tree
---

# Attention heatmap

Two heatmap kinds share one `AttentionHeatmap` union in [attention.ts](../../../src/lib/inference/attention.ts), told apart by `kind`:

| Contract | `kind` | Output | Grid | Method / normalization |
|---|---|---|---|---|
| V3 (current) | `per-label` | `class_activation` `[batch,14,14,14]`, 2744 values in label order | 14×14 | `cam-fc-weights-v1` / `relu-per-label-max-v1` |
| V2 (legacy) | `global` | `attention_map` `[batch,1,7,7]`, 49 values | 7×7 | `attention-rollout-mean-query-v1` / `per-image-min-max-v1` |

V1 releases have no heatmap (`unavailable`).

V3 is a class activation map: SqueezeViT's `fc` weights for each label applied to the 256×14×14 `head_conv` features. The head is a plain average pool, so `mean(raw map) + bias = logit` exactly ([test_cam.py](../../../model-export/test_cam.py)). Negative evidence is clipped, then each label is divided by its own maximum, so a map shows *where* the evidence is, not how likely the finding is. V2 rollout is class-agnostic and stays only for analyses saved before V3.

Localization check: [eval_localization.py](../../../model-export/eval_localization.py) runs a pointing game on NIH's 984 radiologist boxes (is the upsampled map's peak inside the box?). On 2026-10-29, v5 scored CAM 33.4%, rollout 37.2%, image-centre baseline 21.5%. The v6 candidate scored CAM 35.5%, rollout 33.5%. CAM wins on Effusion (v5 52% vs 25%), Pneumothorax and Mass. Rollout wins on Atelectasis (v5 3% vs 29%), Infiltrate and Pneumonia. Cardiomegaly is near the centre baseline (97%), so it says little there.

Deployment status: the owner reports (2026-10-30) that hosted production runs the v6 V3 release `squeezevit-v6-nih-cam-possible85-20261030.1` (CheXpert + NIH retrain, see [model training](model-training.md)). This is not independently verified. It is also active in local Supabase (revision 3). The earlier production release was V2 `squeezevit-v5-kd-cardio042-possible85-20261017.1`, which is the hosted rollback target. The v5 V3 bundle `squeezevit-v5-kd-cam-possible85-20261029.1` was never staged in production. The landing and guide sample in `sample-heatmap.json`, and the PDF guide's Cardiomegaly demo, were regenerated from v6 on 2026-10-30.

Hosted rollout order matters: apply [the V3 migration](../../../supabase/migrations/20261029120000_class_activation_maps.sql), `model:stage` the bundle (v5 or v6 CAM; both are V3), deploy the app, then `model:status` and `model:activate`. A deployed app built before V3 rejects `schemaVersion: 3` in `parseModelManifest`, so activating before the deploy breaks inference until it lands. Rollback target: `squeezevit-v5-kd-cardio042-possible85-20261017.1`. Commands: [release operations](../../../docs/model-releases.md).

## Persistence and access

Learning Mode keeps maps in browser memory and revokes the object URL on replacement/unmount. Activity completion persists the values in `ai_analyses.attention_map` with grid, method and normalization columns; V3 reuses the same columns (2744 values, 14×14, CAM method), so the read RPCs did not change. `storedHeatmap` rebuilds the right kind from `attention_method`. Ready rows are immutable. Students receive maps only after submission and feedback release. Approved Professors read them through the separate heatmap RPC, which carries no probabilities. Direct analysis table reads remain revoked.

## Rendering

The component draws a 112px canvas overlay, bilinearly interpolated between cell centers by `upsampleAttention(values, size, grid)` (display only), colored with the blue-to-red `ATTENTION_RAMP`. It has a toggle, a native opacity slider, a legend and an expandable numeric table of the raw grid.

- V3 adds a native `Finding` select. With probabilities (Learning Mode, Student feedback, the sample) it lists likely then possible findings, most probable first, and shows a message when no finding met its threshold. Without probabilities (Professor review) it lists all 13 findings.
- The attention guide page and the landing page show the real V3 maps for library case `cxp-001`, saved in [sample-heatmap.json](../../../src/components/learning/sample-heatmap.json).
- The PDF guide's inline script copies the ramp and interpolation, now with a grid parameter, plus the sample's Cardiomegaly map; keep them in sync.

Rollback to a V1/V2 release affects new inference only; existing analyses keep their maps.

Sources: [component](../../../src/components/attention-heatmap.tsx),
[runtime](../../../src/lib/inference/runtime.ts),
[authorized projections](../../../src/lib/activity-ai/server.ts),
[V3 database contract](../../../supabase/migrations/20261029120000_class_activation_maps.sql),
[V2 database contract](../../../supabase/migrations/20260922163225_attention_contract_hardening.sql),
[CAM exporter](../../../model-export/export_squeezevit_cam.py),
[SqueezeViT rollout exporter](../../../model-export/export_squeezevit.py),
[FastViT exporter](../../../model-export/export_fastvit.py) (rollout only; no FastViT CAM exporter),
[release operations](../../../docs/model-releases.md).
