---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Login and role routing

Credentials plus expected role → Supabase authentication and trusted profile check → dashboard redirect to the matching role surface.

## Steps

1. The login form collects email, password, and expectedRole through the shared auth surface.
2. The server action validates the fields and checks that expectedRole is a supported AppRole in [actions.ts](<../../src/app/(auth)/actions.ts:101>).
3. Supabase Auth signs in with the password in [actions.ts](<../../src/app/(auth)/actions.ts:124>).
4. The action reads the trusted profile role and signs out if the profile is missing or invalid in [actions.ts](<../../src/app/(auth)/actions.ts:136>).
5. A selected-role mismatch signs out and returns a field error in [actions.ts](<../../src/app/(auth)/actions.ts:149>).
6. A valid login redirects to /dashboard; the dashboard loads the current profile and redirects to /student or /professor in [dashboard/page.tsx](<../../src/app/(protected)/dashboard/page.tsx:6>).
7. The destination page applies requireRole before rendering its role surface.

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [AppRole](../objects/identity/app-role.md)
- [Profile](../objects/identity/profile.md)
- [Auth session and claims](../objects/identity/auth-session.md)

## Produces

- [Role workspace surface](../objects/learning/role-workspace-surface.md)
- An authenticated session when the role check succeeds

## If you change this

### Hits

- Role union, profile lookup, mismatch handling, dashboard redirects, and protected page guards.

### Does not hit

- Password-reset mechanics unless authentication session behavior changes.
- Planned Workspace or activity authorization, which is not implemented.

## See

[actions.ts](<../../src/app/(auth)/actions.ts:101>)
