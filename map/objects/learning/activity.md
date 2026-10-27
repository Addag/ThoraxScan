---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Activity

Activity is the workspace-scoped `public.activities` assignment record plus its professor-only `public.activity_reference_evaluations` answer record.

## Why this shape

Student-readable assignment text is separated from the private teaching reference so Student RLS cannot expose answer content while publication remains one lifecycle.

## Shape

- Activities carry a workspace, one optional draft case, creator, constrained title/instructions, optional due date, and `draft | published | archived` lifecycle in [the activity migration](<../../../supabase/migrations/20260820101401_activities_case_publication.sql:31>).
- One reference evaluation is keyed by activity and cascades only with draft deletion in [the private-reference table](<../../../supabase/migrations/20260820101401_activities_case_publication.sql:73>).
- Database triggers enforce `draft → published → archived`, require a ready case and non-empty reference at publication, forbid published deletion/case replacement, and make archive terminal in [the lifecycle trigger](<../../../supabase/migrations/20260820101401_activities_case_publication.sql:148>).
- TypeScript exposes separate Professor and Student projections so the Student data layer never serializes reference evaluations in [activity types](<../../../src/lib/activities/types.ts:5>). The projections also include the authorized AI status/feedback view.

## Connected to

Owned by a [Workspace](workspace.md), attaches one [X-ray case](xray-case.md), is managed through [activity authoring and publication](../../processes/activity-authoring-publication.md), and is read through [Student activity viewing](../../processes/student-activity-view.md).

## If you change this

### Hits

- Migration constraints/RLS, Professor and Student projections, all five activity routes, dashboard counts/recent cards, Server Action validation, and publication/archive behavior.
- The [bell notification](notification.md) due feed, which filters on `status` and `due_at`.

### Does not hit

- Faculty evaluation is a separate review record keyed by a final submission; [class analytics](analytics.md) reads activity due dates and status. Published activities expose authorized AI analysis and V2 heatmap feedback through their activity projections. Activity publication gates the Student projection.

## Surfaces

Database, authenticated Server Components and Actions, Professor authoring routes, Student read-only routes, and workspace dashboards.

## See

[activity server projections](<../../../src/lib/activities/server.ts:48>)
