---
node_type: object
universe: live
status: verified
audited: 2026-08-30
snapshot: main @ 7aed17a + working tree
---

# Profile

ThoraxScan’s local profile projection identifies an authenticated user by display name and Student/Professor application role, with Professor approval status added to the access projection.

## Why this shape

Supabase Auth owns the identity; the profile adds the application-facing role and display name needed for role routing and the protected workspace surface.

## Shape

- Base TypeScript projection: id, display_name, and role; the access projection adds `professor_application_status` in [types.ts](<../../../src/lib/auth/types.ts:24>).
- Database row: id, display_name, role, created_at, and updated_at in [the migration](<../../../supabase/migrations/20260810163915_auth_profiles.sql:5>).
- id references auth.users(id); display_name is trimmed and limited to 1–100 characters; role is constrained to student or professor in [the migration](<../../../supabase/migrations/20260810163915_auth_profiles.sql:11>).
- Display name is user-editable only through the atomic [account settings update](../../processes/account-settings-update.md); optional Professor phone data remains in the self-private [Account settings](../runtime/account-settings.md) row.

## Connected to

- Created by the private.handle_new_user trigger function after registration.
- Professor registration also creates a [Professor application](professor-application.md).
- Read by the login action and `getCurrentProfile`; Professor access combines role with application status.
- Guards the Student and approved-Professor route surfaces.
- Looks like the planned Workspace Member record, but is not membership data.

## If you change this

### Hits

- Profile migration, trigger, and RLS.
- [auth types](<../../../src/lib/auth/types.ts:24>).
- Registration and login actions.
- `getCurrentProfile`, `requireRole`, application-status routing, and role workspace surfaces.
- Shared settings validation/RPC, settings headings, and any current UI that renders the display name.

### Does not hit

- Password recovery unless the Auth metadata contract changes.
- Student workspace authorization or planned activity/submission records unless their independent contracts change.

## Surfaces

Supabase Postgres, server actions, protected server components, and the authenticated user.

## See

[types.ts](<../../../src/lib/auth/types.ts:24>)
