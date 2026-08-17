---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Workspace creation

Authenticated Professor insert → owner validation and membership trigger → owned Workspace with Professor membership.

## Steps

1. The workspace insert policy requires `owner_id = auth.uid()` and a global Professor profile in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:313>).
2. A trigger validates the owner profile and prevents later ownership transfer in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:142>).
3. The after-insert trigger creates the owner’s Professor membership in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:262>).

The database process is live through the Data API. The named Professor Server Action and creation form are not implemented in the student-first pass.

## Consumes

- [Profile](../objects/identity/profile.md)

## Produces

- [Workspace](../objects/learning/workspace.md)
- [Workspace membership](../objects/learning/workspace-membership.md)

## If you change this

### Hits

- Workspace insert grants/RLS, owner validation, automatic owner membership, and future Professor creation action.

### Does not hit

- Student invitation redemption.

## See

[workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:313>)
