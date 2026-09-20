---
node_type: process
universe: live
status: verified
audited: 2026-09-20
snapshot: main @ f68273c + working tree
---

# Activity AI analysis and controlled release

1. A finalized Student submission trigger creates or preserves a pending feedback-release row.
2. A Student or managed Professor claims the published activity after the final-submission prerequisite. An advisory transaction lock and five-minute lease serialize retries.
3. The browser fetches the existing short-lived Storage URL as a `Blob`, runs `analyzeImage()` with WebGPU/WASM fallback, and submits only probabilities and provenance.
4. The database checks the active release, label count/order, bounded finite probabilities, and attempt token; it derives thresholds, findings, and `No Finding` suppression.
5. A ready analysis releases all finalized submissions. Students render the full payload only after the authorized release RPC confirms `released`; Professors see status and provenance without prediction arrays.
6. Failed or expired attempts are retryable; archived/draft activities cannot start analysis, and heatmaps remain unavailable for the logits-only model.

## See

[AI analysis](../objects/learning/ai-analysis.md), [AI feedback release](../objects/learning/ai-feedback-release.md), and [Student activity viewing](student-activity-view.md).

