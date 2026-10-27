---
node_type: process
universe: live
status: verified
audited: 2026-10-27
snapshot: main @ 76f6977 + working tree
---

# Activity AI analysis and controlled release

1. A finalized Student submission trigger creates or preserves a pending feedback-release row.
2. A Student or managed Professor claims the published activity after the final-submission prerequisite. An advisory transaction lock and five-minute lease serialize retries.
3. The browser fetches the existing short-lived Storage URL as a `Blob`, runs `analyzeImage()` with WebGPU/WASM fallback, and submits only probabilities and provenance.
4. The database checks the active release, label count/order, bounded finite probabilities, and attempt token; it derives thresholds (with each label's optional `possibleThreshold`), findings, and `No Finding` suppression ([possible-thresholds migration](<../../supabase/migrations/20261025120000_activity_ai_possible_thresholds.sql>)).
5. A ready analysis releases all finalized submissions. Students render the full payload, including possible findings derived on read, only after the authorized release RPC confirms `released`; Professors see status and provenance without prediction arrays.
6. Failed or expired attempts are retryable; archived/draft activities cannot start analysis. V1 releases remain heatmap-unavailable; validated V2 releases persist a normalized 49-value map and expose it only through the authorized Student release and Professor workspace projections.

## See

[AI analysis](../objects/learning/ai-analysis.md), [AI feedback release](../objects/learning/ai-feedback-release.md), and [Student activity viewing](student-activity-view.md).

