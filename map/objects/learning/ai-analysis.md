---
node_type: object
universe: live
status: verified
audited: 2026-10-27
snapshot: main @ 76f6977 + working tree
---

# AI analysis

One immutable prediction-only analysis per activity. The browser resolves the active verified ONNX release and sends the fixed 14-probability vector, optional validated V2 attention map, and provenance to the completion RPC.

## Shape

- `public.ai_analyses` uses `pending | ready | failed`, a five-minute claim lease, retry count, safe failure code, all 14 probabilities, thresholds/findings derived from the active manifest, provenance, and V1-unavailable or V2-ready attention fields ([base migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:6>), [V2 contract](<../../../supabase/migrations/20260922163225_attention_contract_hardening.sql:11>)).
- Each stored threshold entry also carries the manifest label's optional `possibleThreshold` (null when the release has none), written by the current `complete_activity_ai_analysis` in [the possible-thresholds migration](<../../../supabase/migrations/20261025120000_activity_ai_possible_thresholds.sql>). Rows completed before that migration have no possible thresholds and so show no possible findings; they are not backfilled.
- Ready rows are protected by an immutable trigger and are not overwritten when a newer model is activated.
- `claim_activity_ai_analysis`, `complete_activity_ai_analysis`, and `fail_activity_ai_analysis` are authenticated, security-definer RPCs with workspace and final-submission checks ([migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:137>)).

## Connected to

[Activity](activity.md), [Student submission](student-submission.md), [AI feedback release](ai-feedback-release.md), and the [browser inference runtime](../inference/browser-inference-runtime.md).

## If you change this

### Hits

Migration constraints/RPCs, the stored `thresholds` JSON shape (including `possibleThreshold`), activity projections, browser analysis adapter, Student feedback UI, Professor status UI, tests, and map process/effect cards.

### Does not hit

Faculty evaluation, analytics, notifications, or Learning Mode's transient history. The heatmap component and authorized projections consume the persisted V2 fields.

