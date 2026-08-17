---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Workspace

Workspace is the professor-owned learning-space record stored as `public.workspaces` and projected into Student and Professor workspace views.

## Why this shape

It gives membership and invitations one stable tenant boundary while ownership remains fixed for this milestone.

## Shape

- UUID primary key, trimmed 3–100 character name, owner foreign key, and timestamps are constrained in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:1>).
- Owner validation now requires approved Professor status, prevents transfer, and still precedes automatic Professor membership in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:252>).
- Joined-workspace reads and owner insert/update policies consume helpers whose current approval-aware definitions are in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:157>).

## Connected to

Owned by an approved Professor [Profile](../identity/profile.md); joined through [Workspace membership](workspace-membership.md); entered through [Invitation code](invitation-code.md); teaching authority depends on [Professor application](../identity/professor-application.md) status.

## If you change this

### Hits

- Workspace constraints, approval-aware owner validation/policies, Student/Professor projections, dashboard cards, detail routes, creation, and rename actions.

### Does not hit

- Activities, cases, inference, analytics, or workspace deletion, which remain deferred.

## Surfaces

Database, Server Components, both role dashboards/details, and Professor creation/rename actions.

## See

[server.ts](<../../../src/lib/workspaces/server.ts:70>)
