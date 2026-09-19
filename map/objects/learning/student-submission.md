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

## Change impact

Field changes affect SQL constraints/RPC, shared validation, action, form, projection, and tests. Deadline/lifecycle changes also affect status cards and the step rail. This milestone does not implement AI feedback, grading, notifications, or Professor review UI.
