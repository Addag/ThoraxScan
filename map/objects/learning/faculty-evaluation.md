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

## Does not do

No revisions, appeals, assignment model, notifications, prediction arrays, or heatmaps.
