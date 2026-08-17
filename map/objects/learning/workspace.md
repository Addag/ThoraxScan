---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Workspace

Workspace is the professor-owned learning-space record stored as `public.workspaces` and projected into Student and Professor workspace views.

## Why this shape

It gives membership and invitations one stable tenant boundary while ownership remains fixed for this milestone.

## Shape

- UUID primary key, trimmed 3–100 character name, owner foreign key, and timestamps are constrained in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:1>).
- Owner validation and automatic Professor membership run after insertion in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:262>).
- Members can read joined workspaces; only Professor profiles can insert owned workspaces; only owners can rename them in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:307>).

## Connected to

Owned by a Profile; joined through [Workspace membership](workspace-membership.md); entered through [Invitation code](invitation-code.md).

## If you change this

### Hits

- Workspace migration constraints and policies, Student/Professor projections, dashboard cards, detail routes, creation, and rename actions.

### Does not hit

- Activities, cases, inference, analytics, or workspace deletion, which remain deferred.

## Surfaces

Database, Server Components, both role dashboards/details, and Professor creation/rename actions.

## See

[server.ts](<../../../src/lib/workspaces/server.ts:70>)
