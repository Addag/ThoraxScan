---
node_type: object
status: live
audited: 2026-09-20
snapshot: working tree
---

# Student submission

One private editable draft or immutable final response per Student/activity. The record contains visible findings, normal/abnormal classification, optional relevant region, and lifecycle timestamps. Final abnormal responses require a region; normal responses clear it. Expired drafts remain unsubmitted. No due date means editable until finalization.

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

Field changes affect SQL constraints/RPC, shared validation, action, form, projection, and tests. Deadline/lifecycle changes also affect status cards, the step rail, and the AI release prerequisite. This milestone does not implement grading, notifications, or faculty evaluation.
