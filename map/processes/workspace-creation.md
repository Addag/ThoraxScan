---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Workspace creation

Authenticated approved-Professor insert → approval-aware owner validation and membership trigger → owned Workspace with Professor membership.

## Steps

1. The existing workspace insert policy derives the current profile role through a helper that now returns Professor only for approved applications in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:157>).
2. The replaced owner-validation trigger function requires approved Professor status and prevents later ownership transfer in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:252>).
3. The after-insert trigger creates the owner’s Professor membership in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:262>).
4. The Professor action obtains a session that checks approved status, then validates the name, inserts with the authenticated owner ID, and revalidates the dashboard in [professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:31>) and [createWorkspaceAction](<../../src/app/(protected)/professor/actions.ts:90>).

The Professor dashboard exposes this process through a pending/error/success form in [professor/page.tsx](<../../src/app/(protected)/professor/page.tsx:71>).

## Consumes

- [Profile](../objects/identity/profile.md)
- [Professor application](../objects/identity/professor-application.md)

## Produces

- [Workspace](../objects/learning/workspace.md)
- [Workspace membership](../objects/learning/workspace-membership.md)

## If you change this

### Hits

- Workspace insert authorization, approval-aware owner validation, automatic owner membership, Professor action/form, and dashboard revalidation.

### Does not hit

- Student invitation redemption.

## See

[professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:82>)
