---
node_type: schema
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Supabase profile schema

The profile schema is `public.profiles` plus its private creation trigger and visibility policy; workspace and approval tables are separate live schemas linked from this card.

## Why this shape

It adds application display name and role to Supabase Auth while allowing self-read and the narrowly scoped teaching-staff roster visibility defined by workspace authorization.

## Shape

- public.profiles.id is the primary key and references auth.users(id) with cascade delete.
- display_name is trimmed and constrained to 1–100 characters.
- role defaults to student and is constrained to student | professor.
- RLS is enabled; profile visibility is self-read plus teaching-staff access to shared-workspace members through the approval-aware private helper now owned by [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:230>).
- The current `private.handle_new_user()` inserts the requested Student/Professor profile and creates a pending application for Professor requests in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:128>).

The base row is owned by [20260810163915_auth_profiles.sql](<../../../supabase/migrations/20260810163915_auth_profiles.sql:5>); later migrations own roster visibility and Professor application creation.

## Connected to

The [Profile](../identity/profile.md), [AppRole](../identity/app-role.md), [Professor application](../identity/professor-application.md), [Workspace membership](../learning/workspace-membership.md), registration action, login action, and `getCurrentProfile`.

## If you change this

### Hits

- SQL migration and any existing data.
- Profile TypeScript projection and role guards.
- Registration metadata, Professor application trigger behavior, login/profile lookup, and roster display-name access.
- RLS and administrator operating procedure.

### Does not hit

- Public landing styling or the static X-ray asset.
- Platform-administrator capability or Professor-application status fields, which live in separate tables.

## Surfaces

Supabase Postgres, Auth trigger execution, server actions, and protected server components.

## See

[20260810163915_auth_profiles.sql](<../../../supabase/migrations/20260810163915_auth_profiles.sql:5>)
