---
node_type: object
universe: live
status: verified
audited: 2026-08-20
snapshot: main @ ed26b07 + working tree
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

Owned by an approved Professor [Profile](../identity/profile.md); joined through [Workspace membership](workspace-membership.md); entered through [Invitation code](invitation-code.md); scopes [Activities](activity.md) and [X-ray cases](xray-case.md); teaching authority depends on [Professor application](../identity/professor-application.md) status.

## If you change this

### Hits

- Workspace constraints, approval-aware owner validation/policies, Student/Professor projections, dashboard cards, detail routes, activity filters/RLS, case object paths, creation, and rename actions.

### Does not hit

- Inference, Student submissions, faculty evaluation, analytics, or ownership transfer.

## Surfaces

Database, Server Components, both role dashboards/details, and Professor creation/rename actions.

## See

[server.ts](<../../../src/lib/workspaces/server.ts:70>)
