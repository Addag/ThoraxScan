---
node_type: object
status: live
audited: 2026-11-16
snapshot: working tree
---

# Student submission

One private editable draft or immutable final response per Student/activity. The answer is `selected_labels`, a selection from the 14 labels (No Finding only on its own), with `label_score` set at finalization against the activity's answer key: correct picks / (key labels + wrong extra picks) × 100 ([answer key migration](<../../../supabase/migrations/20261116120000_professor_validated_answer_key.sql>)). `classification` is derived (normal when only No Finding) so class analytics keeps its normal/abnormal comparison; `visible_findings` and `relevant_region` remain only for finals written before this flow. Expired drafts remain unsubmitted. No due date means editable until finalization.

## See source

- [Schema, grants, RLS, and write RPC](../../../supabase/migrations/20260919160249_student_activity_submissions.sql)
- [Types and display status](../../../src/lib/submissions/types.ts)
- [Normalization and validation](../../../src/lib/submissions/validation.ts)
- [Student projections](../../../src/lib/activities/server.ts)
- [Form and read-only summary](../../../src/components/activities/student-submission-form.tsx)

## Access

Authenticated clients have SELECT only. RLS permits own rows through joined visible activities and permits approved workspace Professors to read only finalized rows. The only client write interface authenticates the Student, locks authorization and activity rows, serializes the Student/activity pair, checks database time after locking, and returns stable result strings. Final rows cannot be changed or deleted.

## AI connection

The after-insert/update trigger creates one pending AI feedback-release row only when this record becomes `submitted`. Finalization remains immutable; inference failure never reopens or changes the submission ([AI release migration](<../../../supabase/migrations/20260920100000_activity_ai_analysis.sql:126>)).

## Change impact

Field changes affect SQL constraints/RPC, shared validation, action, form, projection, and tests. Deadline/lifecycle changes also affect status cards, the step rail, and the AI release prerequisite. Final rows are the immutable input to the separate faculty evaluation workflow and feed the Professor [bell notification](notification.md) list; grading revisions and appeals remain out of scope.
