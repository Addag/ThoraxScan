---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Roster management

Teaching-staff membership read/delete → private authorization helpers and RLS → permitted roster visibility and removal.

## Steps

1. Membership select exposes only self rows to Students and workspace roster rows through a teaching-staff helper that now requires approved Professor status in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:197>).
2. Profile visibility expands only when the viewer is an approved Professor who shares a workspace with the target member in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:230>).
3. The delete policy permits teaching staff to remove Students and owners to remove co-professors while the owner-protection trigger rejects owner removal in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:338>).
4. Professor workspace loading reads roster memberships and separately resolves only RLS-permitted display names in [server.ts](<../../src/lib/workspaces/server.ts:97>).
5. `removeMemberAction` re-derives access and target membership before deleting permitted rows in [professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:295>).

The Professor workspace page renders the live roster and role-permitted removal controls in [workspace page](<../../src/app/(protected)/professor/workspaces/[workspaceId]/page.tsx:112>).

## Consumes

- [Workspace membership](../objects/learning/workspace-membership.md)
- [Profile](../objects/identity/profile.md)
- [Professor application](../objects/identity/professor-application.md)

## Produces

- Authorized roster rows and permitted membership deletion.

## If you change this

### Hits

- Membership/profile RLS helpers, Professor approval checks, delete policy, owner protection, Professor projection, roster UI, and removal action.

### Does not hit

- Student joined-workspace card rendering unless membership visibility itself changes.

## See

[server.ts](<../../src/lib/workspaces/server.ts:97>)
