---
node_type: process
universe: live
status: verified
audited: 2026-11-14
snapshot: main @ 76f6977 + working tree
---

# Activity AI analysis and controlled release

1. A finalized Student submission trigger creates a feedback-release row: `released` when the activity's analysis is already ready, otherwise pending.
2. Only a workspace Professor can claim the published activity, with no submission prerequisite ([claim migration](<../../supabase/migrations/20261114120000_professor_only_activity_ai_claim.sql>)). The Professor activity page starts the run automatically once the activity is published and the analysis is not ready ([status panel](<../../src/components/activities/activity-ai-status.tsx>)); the Student page only reads. An advisory transaction lock and five-minute lease serialize retries.
3. The Professor's browser fetches the existing short-lived Storage URL as a `Blob`, runs `analyzeImage()` with WebGPU/WASM fallback, and submits only probabilities and provenance.
4. The database checks the active release, label count/order, bounded finite probabilities, and attempt token; it derives thresholds (with each label's optional `possibleThreshold`), findings, and `No Finding` suppression ([possible-thresholds migration](<../../supabase/migrations/20261025120000_activity_ai_possible_thresholds.sql>)).
5. A ready analysis releases all finalized submissions. Students render the full payload, including possible findings derived on read, only after the authorized release RPC confirms `released`; Professors see status and provenance without prediction arrays.
6. Failed or expired attempts are retryable by the Professor; archived/draft activities cannot start analysis. V1 releases remain heatmap-unavailable; validated V2 releases persist a normalized 49-value map and V3 releases 2744 values (14 per-label 14×14 maps), and expose them only through the authorized Student release and Professor workspace projections.

## See

[AI analysis](../objects/learning/ai-analysis.md), [AI feedback release](../objects/learning/ai-feedback-release.md), and [Student activity viewing](student-activity-view.md).

