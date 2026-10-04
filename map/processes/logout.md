---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Logout

Authenticated form action → Supabase sign-out → public landing page.

## Steps

1. The authenticated shell and the /dashboard profile-error card render forms that invoke logoutAction in [app-shell.tsx](<../../src/components/app-shell.tsx:84>) and [dashboard/page.tsx](<../../src/app/(protected)/dashboard/page.tsx:22>).
2. logoutAction calls Supabase signOut and redirects to / in [actions.ts](<../../src/app/(protected)/actions.ts:7>).

## Consumes

- [Auth session and claims](../objects/identity/auth-session.md)
- [Role workspace surface](../objects/learning/role-workspace-surface.md)

## Produces

- [Landing surface](../objects/ui/landing-surface.md)
- A signed-out browser state

## If you change this

### Hits

- Role-surface logout control, session termination, and destination behavior.

### Does not hit

- Profile data or database schema.
- Planned LMS records and inference artifacts.

## See

[actions.ts](<../../src/app/(protected)/actions.ts:7>)
