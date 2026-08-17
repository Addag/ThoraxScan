---
node_type: schema
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# AppRole

The application role is the closed union student | professor; `LoginPortal` adds administrator without making it a profile or membership role.

## Why this shape

Student and Professor drive application and workspace authorization, while administrator access is independently derived from a capability row.

## Shape

- TypeScript union in [types.ts](<../../../src/lib/auth/types.ts:1>).
- `LoginPortal = AppRole | "administrator"` in [types.ts](<../../../src/lib/auth/types.ts:2>).
- Runtime guards distinguish the two contracts in [auth actions](<../../../src/app/(auth)/actions.ts:36>).
- SQL constraint permits only student and professor in [the migration](<../../../supabase/migrations/20260810163915_auth_profiles.sql:15>).

## Connected to

The [Profile](profile.md), [Professor application](professor-application.md), registration selector, login portal selector, `requireRole`, and Student/Professor route pages. It looks like Administrator portal selection but does not confer administrator capability.

## If you change this

### Hits

- SQL constraint and existing profile data.
- Registration role selector and login portal selector.
- Login validation and role mismatch errors.
- `requireRole`, `/student`, `/professor`, membership role matching, and invitation role matching.

### Does not hit

- Public landing layout or password-reset mechanics.
- Platform-administrator capability unless the separate `LoginPortal`/capability contract also changes.

## Surfaces

TypeScript compile-time checks, server-side auth validation, SQL constraints, registration/login UI, and workspace authorization.

## See

[types.ts](<../../../src/lib/auth/types.ts:1>)
