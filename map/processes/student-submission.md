---
node_type: process
status: live
audited: 2026-11-16
snapshot: working tree
---

# Student submission workflow

1. [Student activity projection](../../src/lib/activities/server.ts) selects the caller's response alongside published activity content.
2. [Form](../../src/components/activities/student-submission-form.tsx) is a multiselect over the 14 labels (No Finding stands alone). It permits draft saves and requires explicit confirmation for final submission. Pending controls are disabled and messages/errors are announced.
3. [Server Action](<../../src/app/(protected)/student/activities/actions.ts>) verifies the activity UUID, reauthenticates, checks Student role, normalizes/validates the labels, and invokes the RPC.
4. [Database write interface](../../supabase/migrations/20260919160249_student_activity_submissions.sql) rechecks authorization and publication, serializes writes, rejects finalized/expired responses and activities without an answer key, and saves or finalizes the single row. On finalize it stores `label_score` = correct picks / (key labels + wrong extra picks) × 100 ([answer key migration](../../supabase/migrations/20261116120000_professor_validated_answer_key.sql)).
5. The action revalidates detail, list, and dashboard. Final submissions render a read-only summary and timestamp; expired drafts explicitly remain not submitted.

## Verification

[Database tests](../../supabase/tests/database/student_submissions.test.sql), [validation tests](../../src/lib/submissions/validation.test.ts), and [browser tests](../../src/components/activities/student-submission-form.browser.test.tsx) cover the contract. Hosted deployment remains separate from local migration verification.

Local verification on 2026-09-20 also exercised draft persistence after reload, final confirmation and timestamp, expired-draft read-only state, and twelve concurrent draft/final RPC calls producing one immutable final row. Anonymous grants are checked in pgTAP; direct denied anonymous RPC execution crashed the local Postgres image, including on the unchanged account-settings RPC, so that runtime check remains an environment limitation.

## Does not do

No automatic finalization, late submissions, revision history, Student withdrawal, inference, faculty review UI, or notifications.
