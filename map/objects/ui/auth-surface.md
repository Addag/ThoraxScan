---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Authentication surface

The authentication surface is the shared layout and client form used by login, registration, password recovery, and password reset pages.

## Why this shape

One form component keeps field states, role selection, pending states, and action feedback consistent across the four auth modes.

## Shape

- Auth modes are login, register, forgot, and reset in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:15>).
- The layout provides the shared product message and form panel in [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx:30>).
- Form submissions select the corresponding server action in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:17>).

## Connected to

The [authentication processes](../../processes/CONTEXT.md), [auth session](../identity/auth-session.md), AppRole selector, Brand, and public assets.

## If you change this

### Hits

- All four auth pages and their pending/error/success states.
- Field names consumed by the server actions.
- Role-selection behavior and auth copy.

### Does not hit

- Protected workspace content or planned LMS records.
- Database constraints unless form field contracts change.

## Surfaces

Public browser routes, client form state, server actions, and authenticated users during account entry.

## See

[auth-form.tsx](<../../../src/components/auth/auth-form.tsx:31>)
