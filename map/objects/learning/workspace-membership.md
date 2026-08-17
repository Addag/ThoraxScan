---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Workspace membership

Workspace membership is the composite `public.workspace_members` join between a user and Workspace with a Student or Professor access role.

## Why this shape

The composite key makes membership unique and lets RLS authorize workspace reads without trusting form-supplied roles.

## Shape

- `(workspace_id, user_id)` is the primary key; role must be Student or Professor and is validated against the global profile in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:13>).
- Students can read only their own memberships; teaching staff can read the roster in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:328>).
- Owner membership cannot be removed; teaching staff removal and co-professor self-exit are constrained by the delete policy in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:338>).

## Connected to

Joins Profile to [Workspace](workspace.md); produced by workspace creation and [Invitation code](invitation-code.md) redemption.

## If you change this

### Hits

- RLS helper functions, profile visibility, roster access, redemption, membership exit, and Student workspace queries.

### Does not hit

- Invitation plaintext generation; plaintext is never a membership field.

## Surfaces

Database, Student Server Components, teaching-staff Data API access, and future roster actions.

## See

[workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:13>)
