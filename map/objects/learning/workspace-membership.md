---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Workspace membership

Workspace membership is the composite `public.workspace_members` join between a user and Workspace with a Student or Professor access role.

## Why this shape

The composite key makes membership unique and lets RLS authorize workspace reads without trusting form-supplied roles.

## Shape

- `(workspace_id, user_id)` is the primary key; role must match the global profile, and Professor membership now additionally requires approved status in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:271>).
- Students can read only their own memberships; only approved teaching staff satisfy the roster helper used by membership RLS in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:197>).
- Owner membership cannot be removed; teaching staff removal and co-professor self-exit are constrained by the delete policy in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:338>).

## Connected to

Joins [Profile](../identity/profile.md) to [Workspace](workspace.md); produced by workspace creation and [Invitation code](invitation-code.md) redemption; Professor rows depend on [Professor application](../identity/professor-application.md) approval.

## If you change this

### Hits

- RLS helper functions, Professor approval validation, profile visibility, roster access, redemption, membership exit, and Student workspace queries.

### Does not hit

- Invitation plaintext generation; plaintext is never a membership field.

## Surfaces

Database, Student Server Components, teaching-staff Data API access, and future roster actions.

## See

[workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:13>)
