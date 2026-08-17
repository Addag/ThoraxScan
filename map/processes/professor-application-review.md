---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Review a Professor application

Professor registration → pending status → administrator review → approved workspace access or rejected status.

## Steps

1. Registration submits `requested_role`; the Auth trigger creates a Professor profile and pending application in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:128>).
2. Profile loading reads the caller's application status, and pending or rejected Professors are routed to `/professor/application` in [auth server guards](<../../src/lib/auth/server.ts:35>).
3. Administrator login requires a `platform_admins` capability before redirecting to `/admin` in [auth actions](<../../src/app/(auth)/actions.ts:151>).
4. The administrator-only listing RPC returns application identity, email-confirmation state, and membership count in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:308>).
5. The review RPC re-checks capability and locks the application before approving or rejecting it; approval additionally requires confirmed email and no memberships in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:363>).
6. The review action revalidates `/admin`, `/dashboard`, and `/professor/application` in [admin/actions.ts](<../../src/app/(protected)/admin/actions.ts:92>); approved Professors reach `/professor`, while rejected applicants see their status and optional reason in [application/page.tsx](<../../src/app/(protected)/professor/application/page.tsx:17>).

## Consumes

- [Profile](../objects/identity/profile.md)
- [Professor application](../objects/identity/professor-application.md)
- [Platform administrator](../objects/identity/platform-administrator.md)

## Produces

- Approved Professor workspace access or a recorded rejected application.
- [Administrator approval surface](../objects/ui/administrator-approval-surface.md)

## If you change this

### Hits

- Registration, login, application RLS, administrator authorization, review transitions, and Professor workspace guards.

### Does not hit

- Student account provisioning or password-recovery movement.

## See

[review RPC](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:363>)
