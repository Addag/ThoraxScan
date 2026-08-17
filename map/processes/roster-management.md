---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Roster management

Teaching-staff membership read/delete → private authorization helpers and RLS → permitted roster visibility and removal.

## Steps

1. Membership select exposes only self rows to Students and workspace roster rows to teaching staff in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:328>).
2. Profile visibility expands only when the viewer is a Professor who shares a workspace with the target member in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:121>).
3. The delete policy permits teaching staff to remove Students and owners to remove co-professors while the owner-protection trigger rejects owner removal in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:338>).

The database process is live. The Professor roster page and `removeMemberAction` are deferred.

## Consumes

- [Workspace membership](../objects/learning/workspace-membership.md)
- [Profile](../objects/identity/profile.md)

## Produces

- Authorized roster rows and permitted membership deletion.

## If you change this

### Hits

- Membership/profile RLS helpers, delete policy, owner protection, and future Professor roster UI/actions.

### Does not hit

- Student joined-workspace card rendering unless membership visibility itself changes.

## See

[workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:328>)
