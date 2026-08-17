---
node_type: contract
status: live
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Identity objects

## Inputs

- ../../../src/lib/auth/
- ../../../src/app/(auth)/
- ../../../src/app/auth/confirm/route.ts
- ../../../supabase/migrations/20260810163915_auth_profiles.sql

## Job

Describe the identity objects that are implemented: the profile projection, allowed roles, and session/claim boundary.

## Outputs

Cards for [Profile](profile.md), [AppRole](app-role.md), and [auth session](auth-session.md).

## Human check

When identity changes, compare the TypeScript types, SQL constraints, auth actions, and protected-route guards together.
