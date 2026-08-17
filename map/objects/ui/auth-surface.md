---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Authentication surface

The authentication surface is the shared layout and client form used by login, registration, password recovery, and password reset pages.

## Why this shape

One form component keeps field states, requested application role, selected login portal, pending states, and action feedback consistent across the four auth modes.

## Shape

- Auth modes are login, register, forgot, and reset in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:15>).
- The layout provides the shared product message and form panel in [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx:30>).
- Form submissions select the corresponding server action in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:17>).
- Registration offers Student or Professor as `requestedRole`; login adds Administrator as an `expectedRole` portal in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:195>).

## Connected to

The [authentication processes](../../processes/CONTEXT.md), [auth session](../identity/auth-session.md), [AppRole](../identity/app-role.md), [Platform administrator](../identity/platform-administrator.md), [Professor application](../identity/professor-application.md), Brand, and public assets.

## If you change this

### Hits

- All four auth pages and their pending/error/success states.
- Field names consumed by the server actions.
- Requested-role, login-portal, Professor-review guidance, and auth copy.

### Does not hit

- Protected workspace content or administrator review behavior beyond their entry fields.
- Database constraints unless form field contracts change.

## Surfaces

Public browser routes, client form state, server actions, and authenticated users during account entry.

## See

[auth-form.tsx](<../../../src/components/auth/auth-form.tsx:31>)
