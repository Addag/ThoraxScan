---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Profile

ThoraxScan’s local profile projection identifies an authenticated user by display name and application role.

## Why this shape

Supabase Auth owns the identity; the profile adds the application-facing role and display name needed for role routing and the protected workspace surface.

## Shape

- TypeScript projection: id, display_name, and role in [types.ts](<../../../src/lib/auth/types.ts:21>).
- Database row: id, display_name, role, created_at, and updated_at in [the migration](<../../../supabase/migrations/20260810163915_auth_profiles.sql:5>).
- id references auth.users(id); display_name is trimmed and limited to 1–100 characters; role is constrained to student or professor in [the migration](<../../../supabase/migrations/20260810163915_auth_profiles.sql:11>).

## Connected to

- Created by the private.handle_new_user trigger function after registration.
- Read by the login action and getCurrentProfile.
- Guards the student and professor route surfaces.
- Looks like the planned Workspace Member record, but is not membership data.

## If you change this

### Hits

- Profile migration, trigger, and RLS.
- [auth types](<../../../src/lib/auth/types.ts:1>).
- Registration and login actions.
- getCurrentProfile, requireRole, and the role placeholder.

### Does not hit

- Password recovery unless the Auth metadata contract changes.
- Planned workspace, activity, or submission records; those are not implemented yet.

## Surfaces

Supabase Postgres, server actions, protected server components, and the authenticated user.

## See

[supabase-profile-schema.md](../runtime/supabase-profile-schema.md)
