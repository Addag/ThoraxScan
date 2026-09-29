---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 784649f
---

# Authentication surface

The authentication surface is the shared layout and client form used by login, registration, password recovery, and password reset pages.

## Why this shape

One form component keeps field states, requested application role, selected login portal, pending states, and action feedback consistent across the four auth modes.

## Shape

- Auth modes are login, register, forgot, and reset in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:19>).
- The layout provides the shared product message and form panel in [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx:30>).
- Form submissions select the corresponding server action in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:21>).
- Registration, login, and forgot-password require a single-use Cloudflare Turnstile token; reset-password remains protected by its recovery session in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:45>).
- The role selector renders first on both login and register; registration offers Student or Professor as `requestedRole`, login adds Administrator as an `expectedRole` portal in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:68>) and [RoleSelector](<../../../src/components/auth/auth-form.tsx:312>).
- Password fields carry a client-only show/hide toggle (`.auth-password-control`) in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:133>); it changes no field names.

## Connected to

The [authentication processes](../../processes/CONTEXT.md), [auth session](../identity/auth-session.md), [AppRole](../identity/app-role.md), [Platform administrator](../identity/platform-administrator.md), [Professor application](../identity/professor-application.md), Brand, and public assets.

## If you change this

### Hits

- All four auth pages, CAPTCHA lifecycle, and pending/error/success states.
- Field names consumed by the server actions.
- Requested-role, login-portal, Professor-review guidance, and auth copy.

### Does not hit

- Protected workspace content or administrator review behavior beyond their entry fields.
- Database constraints unless form field contracts change.

## Surfaces

Public browser routes, client form state, server actions, and authenticated users during account entry.

## See

[auth-form.tsx](<../../../src/components/auth/auth-form.tsx:37>)
