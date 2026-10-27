---
node_type: object
universe: live
status: verified
audited: 2026-10-28
snapshot: main @ working tree
---

# Class analytics

Class analytics is a read-time Professor projection over one workspace. It covers the current student roster, the workspace's non-draft activities, final submissions, faculty evaluations, and one derived AI call per activity. Nothing is stored.

## Why this shape

Professors can read only final submissions under RLS, so drafts are invisible. A Student/activity pair is therefore on time, late, missing (past due with no final submission), or open. Aggregation is pure TypeScript so it can be unit-tested without a database ([summary](<../../../src/lib/analytics/summary.ts:16>)).

## Shape

- [The loader](<../../../src/lib/analytics/server.ts:10>) gates on `getProfessorWorkspace` and reuses `getProfessorActivities` and `getProfessorSubmissions`. Denominators use current student members, so submissions from former members are ignored.
- Averages count released scores only. The review backlog counts unreviewed, draft, and released evaluations.
- Student vs. AI agreement compares the student's normal/abnormal classification with `get_professor_workspace_ai_calls`. That function returns only `'normal' | 'abnormal'` per ready analysis and skips empty `findings` ([migration](<../../../supabase/migrations/20261028120000_professor_workspace_ai_calls.sql:4>)). The UI labels AI output as a prediction, not ground truth.
- [The page](<../../../src/app/(protected)/professor/analytics/page.tsx>) at `/professor/analytics` has workspace and activity filters, stat cards, and per-activity and per-student tables. [The export route](<../../../src/app/(protected)/professor/analytics/export/route.ts>) returns the per-student CSV with formula-prefix neutralization, and gives 403 to anyone other than an approved Professor of the workspace.

## Connected to

[Workspace membership](workspace-membership.md), [Activity](activity.md), [Student submission](student-submission.md), [Faculty evaluation](faculty-evaluation.md), [AI analysis](ai-analysis.md), and the Professor shell navigation.

## If you change this

### Hits

- Submission `status`/`submitted_at`/`classification`, activity `due_at`/`status`, evaluation `status`/`score`, or the `findings` label contract all change the metrics. Then update [the unit test](<../../../src/lib/analytics/summary.test.ts>) and [the pgTAP test](<../../../supabase/tests/database/professor_workspace_ai_calls.test.sql>).

### Does not hit

- Student surfaces, notifications, AI analysis writes, or stored data.

## See

[summary.ts](<../../../src/lib/analytics/summary.ts>)
