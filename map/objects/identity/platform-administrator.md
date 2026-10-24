---
node_type: object
universe: live
status: verified
audited: 2026-10-24
snapshot: main @ 391ebdb + working tree
---

# Platform administrator

A platform administrator is an authenticated profile with a separately bootstrapped capability to review Professor applications.

## Why this shape

Administrator authority is stored separately from `Profile.role`, preserving the closed Student/Professor application-role contract while allowing narrowly scoped platform review access.

## Shape

- `public.platform_admins.user_id` is a profile-backed primary key and deletion of the profile cascades to the capability in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:1>). Since [the admin management migration](<../../../supabase/migrations/20261024130000_platform_admin_management.sql>), `created_by` and `professor_applications.reviewed_by` reference `profiles`, so removing a capability keeps the name on past grants and reviews.
- RLS exposes only the authenticated caller's capability row in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:54>).
- Administrator login and protected-page access each re-check that row in [auth actions](<../../../src/app/(auth)/actions.ts:151>) and [auth server guards](<../../../src/lib/auth/server.ts:86>). The dashboard uses the shared Tailwind primitives in [dashboard-ui.tsx](<../../../src/components/dashboard-ui.tsx>).
- The first capability is inserted by an operator using the documented bootstrap statement in [README.md](<../../../README.md:47>); no public self-provisioning path exists.
- After that, administrators list, grant (by email of a confirmed account), and revoke capabilities through `list_platform_admins`, `grant_platform_admin`, and `revoke_platform_admin` in [the admin management migration](<../../../supabase/migrations/20261024130000_platform_admin_management.sql>). Revoke refuses the caller's own row, so at least one administrator always remains; it share-locks the caller's row so two administrators cannot remove each other at once.

## Connected to

Connected to the [Professor application](professor-application.md), the `LoginPortal` administrator option, the review RPC, and the [Administrator approval surface](../ui/administrator-approval-surface.md). It looks like an application role but is not part of `AppRole` or workspace membership.

## If you change this

### Hits

- Administrator login, `/admin` protection, application listing, review authorization, and bootstrap instructions.

### Does not hit

- Student/Professor profile roles or workspace membership roles unless those independent contracts are also changed.

## Surfaces

Supabase Postgres, login and route guards, the administrator dashboard, and the human operator who bootstraps the first capability.

## See

[approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:1>)
