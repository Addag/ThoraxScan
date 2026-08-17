---
node_type: schema
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# AppRole

The application role is the closed union student | professor, mirrored by the database role constraint.

## Why this shape

The login flow asks the user to select an expected role, then compares it with the trusted profile role before allowing role routing.

## Shape

- TypeScript union in [types.ts](<../../../src/lib/auth/types.ts:1>).
- Runtime guard in [auth actions](<../../../src/app/(auth)/actions.ts:31>).
- SQL constraint permits only student and professor in [the migration](<../../../supabase/migrations/20260810163915_auth_profiles.sql:15>).

## Connected to

The [Profile](profile.md), role selector, login action, requireRole, and the two protected route pages.

## If you change this

### Hits

- SQL constraint and existing profile data.
- Role selector and registration copy.
- Login validation and role mismatch errors.
- requireRole, /student, and /professor.

### Does not hit

- Public landing layout or password-reset mechanics.
- Planned workspace membership roles until those records are implemented.

## Surfaces

TypeScript compile-time checks, server-side auth validation, SQL constraints, and the login UI.

## See

[types.ts](<../../../src/lib/auth/types.ts:1>)
