---
node_type: object
status: live
audited: 2026-09-21
snapshot: working tree
---

# Faculty evaluation

One Professor evaluation belongs to one immutable final Student submission. A draft stores a percentage score, Professor-only remarks, and feedback. Explicit release makes the row immutable and exposes only score, feedback, and release time to the Student while the activity is published.

## See source

- [Schema and RPC](../../../supabase/migrations/20260920161434_faculty_evaluations.sql)
- [Server projections](../../../src/lib/evaluations/server.ts)
- [Professor form](../../../src/components/professor/faculty-evaluation-form.tsx)
- [Student panel](../../../src/components/activities/student-faculty-evaluation.tsx)
- [Shared review utilities](../../../src/components/professor/review-styles.ts)

The review list, detail page, grading form, Student evaluation panel, and attention heatmap use Tailwind utilities in their components plus `review-styles.ts`. Review cards and the Student panel retain their existing borderless layout.

## Does not do

No revisions, appeals, assignment model, prediction arrays, or heatmaps. Released evaluations appear in the Student [bell](notification.md).

## Live release

Students cannot read `faculty_evaluations` (it holds Professor-only remarks). When a row becomes `released`, the `faculty_evaluations_broadcast_release` trigger sends an empty private `feedback_released` broadcast to the Student's `notifications:<student id>` topic, and the open page re-renders through the existing projections ([realtime migration](../../../supabase/migrations/20261118130000_notification_realtime.sql)). Changing the release transition or the submission-to-Student link hits that trigger.
