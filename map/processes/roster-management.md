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
4. Professor workspace loading reads roster memberships and separately resolves only RLS-permitted display names in [server.ts](<../../src/lib/workspaces/server.ts:97>).
5. `removeMemberAction` re-derives access and target membership before deleting permitted rows in [professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:287>).

The Professor workspace page renders the live roster and role-permitted removal controls in [workspace page](<../../src/app/(protected)/professor/workspaces/[workspaceId]/page.tsx:112>).

## Consumes

- [Workspace membership](../objects/learning/workspace-membership.md)
- [Profile](../objects/identity/profile.md)

## Produces

- Authorized roster rows and permitted membership deletion.

## If you change this

### Hits

- Membership/profile RLS helpers, delete policy, owner protection, Professor projection, roster UI, and removal action.

### Does not hit

- Student joined-workspace card rendering unless membership visibility itself changes.

## See

[server.ts](<../../src/lib/workspaces/server.ts:97>)
