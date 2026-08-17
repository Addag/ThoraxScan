---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Membership exit

Permitted membership delete → RLS and owner-protection trigger → removed membership or rejected owner exit.

## Steps

1. A co-professor may delete their own membership; an owner may delete another Professor membership; teaching staff may delete Student memberships in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:338>).
2. Before deletion, the owner-protection trigger rejects removal when the target user owns the workspace in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:238>).
3. After a permitted delete, Workspace RLS no longer exposes that workspace to the former member in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:307>).
4. `leaveWorkspaceAction` re-derives co-professor access, rejects owners, deletes only the caller’s membership, and redirects to the Professor dashboard in [professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:326>).

Owner and Student exits are not exposed as self-service application controls in this milestone.

## Consumes

- [Workspace membership](../objects/learning/workspace-membership.md)
- [Workspace](../objects/learning/workspace.md)

## Produces

- Membership removal or an owner-protection error.

## If you change this

### Hits

- Delete grants/RLS, owner trigger, workspace visibility, Professor leave control, and redirect behavior.

### Does not hit

- Workspace ownership transfer, which is explicitly unsupported.

## See

[professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:326>)
