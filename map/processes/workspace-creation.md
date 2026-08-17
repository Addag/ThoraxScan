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
4. The Professor action re-derives the Professor profile, validates the name, inserts with the authenticated owner ID, and revalidates the dashboard in [professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:82>).

The Professor dashboard exposes this process through a pending/error/success form in [professor/page.tsx](<../../src/app/(protected)/professor/page.tsx:71>).

## Consumes

- [Profile](../objects/identity/profile.md)

## Produces

- [Workspace](../objects/learning/workspace.md)
- [Workspace membership](../objects/learning/workspace-membership.md)

## If you change this

### Hits

- Workspace insert grants/RLS, owner validation, automatic owner membership, Professor action/form, and dashboard revalidation.

### Does not hit

- Student invitation redemption.

## See

[professor/actions.ts](<../../src/app/(protected)/professor/actions.ts:82>)
