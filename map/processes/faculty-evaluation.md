---
node_type: process
status: live
audited: 2026-09-21
snapshot: working tree
---

# Faculty evaluation workflow

1. Authorized Professors discover final submissions in the review queue, including archived activities.
2. A Professor saves a non-empty draft through the authenticated RPC; drafts remain private.
3. The Professor explicitly confirms release. Score and feedback are required; the released row is immutable.
4. The Student projection returns locked, awaiting review, or released and never includes remarks or draft values.

## Verification

[Database checks](../../supabase/tests/database/faculty_evaluations.test.sql), [validation tests](../../src/lib/evaluations/validation.test.ts), and the Professor/Student route contracts cover this boundary.
