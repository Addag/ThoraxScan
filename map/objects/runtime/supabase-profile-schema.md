---
node_type: schema
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Supabase profile schema

The only application table currently defined by the repository is public.profiles, plus its private creation trigger and self-read RLS policy.

## Why this shape

It adds application display name and role to Supabase Auth while keeping profile reads restricted to the authenticated user.

## Shape

- public.profiles.id is the primary key and references auth.users(id) with cascade delete.
- display_name is trimmed and constrained to 1–100 characters.
- role defaults to student and is constrained to student | professor.
- RLS is enabled; authenticated users receive select access and the policy permits reading only the row whose id equals auth.uid().
- private.handle_new_user() inserts a profile after a new Auth user is created.

All of these facts are owned by [20260810163915_auth_profiles.sql](<../../../supabase/migrations/20260810163915_auth_profiles.sql:5>).

## Connected to

The [Profile](../identity/profile.md), [AppRole](../identity/app-role.md), registration action, login action, and getCurrentProfile.

## If you change this

### Hits

- SQL migration and any existing data.
- Profile TypeScript projection and role guards.
- Registration metadata and login profile lookup.
- RLS and administrator operating procedure.

### Does not hit

- Public landing styling or the static X-ray asset.
- Planned LMS tables until they are added to the schema.

## Surfaces

Supabase Postgres, Auth trigger execution, server actions, and protected server components.

## See

[20260810163915_auth_profiles.sql](<../../../supabase/migrations/20260810163915_auth_profiles.sql:5>)
