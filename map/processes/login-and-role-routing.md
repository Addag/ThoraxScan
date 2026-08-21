---
node_type: process
universe: live
status: verified
audited: 2026-08-22
snapshot: main @ 59e6d7d + working tree
---

# Login and role routing

Credentials, selected portal, and Turnstile token → Supabase authentication and trusted profile/capability check → role, application-status, or administrator routing.

## Steps

1. The login form collects email, password, `expectedRole`, and a Cloudflare Turnstile token through the shared auth surface in [auth-form.tsx](<../../src/components/auth/auth-form.tsx:183>) and [role selector](<../../src/components/auth/auth-form.tsx:281>).
2. The server action requires the Turnstile token and validates Student, Professor, or Administrator as the selected `LoginPortal` in [actions.ts](<../../src/app/(auth)/actions.ts:131>).
3. Supabase Auth verifies the CAPTCHA token while signing in with the password in [actions.ts](<../../src/app/(auth)/actions.ts:157>).
4. Administrator selection checks `platform_admins`, signs out unauthorized callers, and redirects authorized callers to `/admin` in [actions.ts](<../../src/app/(auth)/actions.ts:171>).
5. Student/Professor selection reads the trusted profile role; a missing, invalid, or mismatched profile signs out and returns an error in [actions.ts](<../../src/app/(auth)/actions.ts:188>).
6. Student and Professor logins route through `/dashboard`; the dashboard redirects pending/rejected Professors to `/professor/application` in [dashboard/page.tsx](<../../src/app/(protected)/dashboard/page.tsx:28>).
7. Destination pages re-check the role plus Professor approval or administrator capability before rendering in [auth server guards](<../../src/lib/auth/server.ts:65>).

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [AppRole](../objects/identity/app-role.md)
- [Profile](../objects/identity/profile.md)
- [Auth session and claims](../objects/identity/auth-session.md)
- [Professor application](../objects/identity/professor-application.md)
- [Platform administrator](../objects/identity/platform-administrator.md)

## Produces

- [Role workspace surface](../objects/learning/role-workspace-surface.md)
- [Administrator approval surface](../objects/ui/administrator-approval-surface.md)
- An authenticated session when the role check succeeds

## If you change this

### Hits

- CAPTCHA validation, login portal union, capability/profile lookup, mismatch handling, Professor status routing, dashboard redirects, and protected page guards.

### Does not hit

- Password-reset mechanics unless authentication session behavior changes.
- Registration and Professor review decisions; login only consumes their resulting records.

## See

[actions.ts](<../../src/app/(auth)/actions.ts:131>)
