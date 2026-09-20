---
node_type: object
universe: live
status: verified
audited: 2026-09-20
snapshot: main @ f68273c + working tree
---

# AI analysis

One immutable prediction-only analysis per activity. The browser resolves the active verified ONNX release and sends only the fixed 14-probability vector plus provenance to the completion RPC.

## Shape

- `public.ai_analyses` uses `pending | ready | failed`, a five-minute claim lease, retry count, safe failure code, all 14 probabilities, thresholds/findings derived from the active manifest, provenance, and `attention_status = unavailable` ([migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:6>)).
- Ready rows are protected by an immutable trigger and are not overwritten when a newer model is activated.
- `claim_activity_ai_analysis`, `complete_activity_ai_analysis`, and `fail_activity_ai_analysis` are authenticated, security-definer RPCs with workspace and final-submission checks ([migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:137>)).

## Connected to

[Activity](activity.md), [Student submission](student-submission.md), [AI feedback release](ai-feedback-release.md), and the [browser inference runtime](../inference/browser-inference-runtime.md).

## If you change this

### Hits

Migration constraints/RPCs, activity projections, browser analysis adapter, Student feedback UI, Professor status UI, tests, and map process/effect cards.

### Does not hit

Attention heatmaps, faculty evaluation, analytics, notifications, or Learning Mode's transient history.

