---
node_type: object
universe: live
status: verified
audited: 2026-09-20
snapshot: main @ f68273c + working tree
---

# AI feedback release

`public.ai_feedback_releases` is the database gate between a finalized Student submission and the persisted activity prediction. Draft submissions never create a release row; a ready analysis releases every finalized submission exactly once.

## Shape and access

Each final submission has one `pending_analysis` or immutable `released` row, with the linked analysis and `released_at` set only during the automatic transition ([migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:57>)). Students receive prediction arrays only from `get_student_activity_ai_feedback` after their own release is `released`; Professors receive status/provenance metadata only from `get_professor_activity_ai_status` ([migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:303>)).

## Connected to

[Student submission](student-submission.md), [AI analysis](ai-analysis.md), [Activity](activity.md), and [Student activity viewing](../../processes/student-activity-view.md).

