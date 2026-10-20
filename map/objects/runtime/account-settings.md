---
node_type: object
universe: live
status: verified
audited: 2026-08-30
snapshot: main @ 7aed17a + working tree
---

# Account settings

Account settings is the self-private `public.account_settings` row that stores optional Professor work phone data outside the profile projection.

## Why this shape

Teaching staff may read selected workspace-member profiles, so private phone data needs a separate self-only table while one authenticated RPC coordinates display-name and settings updates atomically.

## Shape

- One row is keyed to `profiles.id`, cascades with the profile, and carries created/updated timestamps in [the settings migration](<../../../supabase/migrations/20260830121651_shared_account_settings.sql:1>).
- Authenticated clients receive only `SELECT`; RLS filters reads to `auth.uid() = profile_id`, while direct insert, update, and delete privileges remain revoked in [the settings policy](<../../../supabase/migrations/20260830121651_shared_account_settings.sql:19>).
- `update_own_account_settings` validates and atomically updates the caller's display name plus the settings upsert, rejects Student phone values, and is executable only by authenticated callers in [the RPC](<../../../supabase/migrations/20261021120000_drop_dark_image_background.sql:3>). The former `dark_image_background` column and its RPC argument were dropped in that migration.
- A missing row projects to `workPhone: null` in [the server reader](<../../../src/lib/settings/server.ts:11>).

## Connected to

Extends the private preferences of [Profile](../identity/profile.md), is edited through the [Shared settings surface](../ui/shared-settings-surface.md) and [account settings update](../../processes/account-settings-update.md).

## If you change this

### Hits

- Additive migration, RLS/grants, authenticated RPC, settings types/validation/readers, and both role settings routes.

### Does not hit

- Supabase Auth email ownership, workspace membership roles, case object access, or model-release activation.

## Surfaces

Supabase Postgres, authenticated Server Components and Actions, and the shared settings form.

## See

[account settings migration](<../../../supabase/migrations/20260830121651_shared_account_settings.sql:1>), [image-background removal migration](<../../../supabase/migrations/20261021120000_drop_dark_image_background.sql:1>)
