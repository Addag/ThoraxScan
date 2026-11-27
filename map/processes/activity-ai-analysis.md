---
node_type: process
universe: live
status: verified
audited: 2026-11-18
snapshot: main @ 76f6977 + working tree
---

# Activity AI analysis and controlled release

1. A finalized Student submission trigger creates a feedback-release row: `released` when the activity's analysis is already ready, otherwise pending.
2. Only a workspace Professor can claim a draft or published activity with a ready case ([answer key migration](<../../supabase/migrations/20261116120000_professor_validated_answer_key.sql>)). The Professor activity page starts the run automatically as soon as the draft's case is ready and the analysis is not ready ([status panel](<../../src/components/activities/activity-ai-status.tsx>)); the Student page only reads. An advisory transaction lock and five-minute lease serialize retries.
3. The Professor's browser fetches the existing short-lived Storage URL as a `Blob`, runs `analyzeImage()` with WebGPU/WASM fallback, and submits only probabilities and provenance.
4. The database checks the active release, label count/order, bounded finite probabilities, and attempt token; it derives thresholds (with each label's optional `possibleThreshold`), findings, and `No Finding` suppression ([possible-thresholds migration](<../../supabase/migrations/20261025120000_activity_ai_possible_thresholds.sql>)).
5. The Professor validates the ready analysis into the answer key before publishing (see [authoring](activity-authoring-publication.md)); Professors read the AI's finding labels through `get_professor_activity_ai_findings` but never the probabilities. A ready analysis releases all finalized submissions. After the authorized release RPC confirms `released`, Students receive the validated labels and the key's heatmap in place of the raw AI map, and the page shows them against the Student's own labels. When a release turns `released` (the analysis finished after the Student submitted), the `ai_feedback_releases_broadcast_release` trigger sends an empty private `feedback_released` broadcast to the Student's `notifications:<id>` topic, and the open page refreshes through the [bell listener](../objects/learning/notification.md) ([live results migration](<../../supabase/migrations/20261118140000_live_activity_results.sql>)).
6. Failed or expired attempts are retryable by the Professor; archived activities cannot start analysis. Replacing a draft's case or deleting the draft deletes its analysis. V1 releases remain heatmap-unavailable; validated V2 releases persist a normalized 49-value map and V3 releases 2744 values (14 per-label 14×14 maps), and expose them only through the authorized Student release and Professor workspace projections.

## See

[AI analysis](../objects/learning/ai-analysis.md), [AI feedback release](../objects/learning/ai-feedback-release.md), and [Student activity viewing](student-activity-view.md).

