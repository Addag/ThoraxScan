---
node_type: process
universe: live
status: verified
audited: 2026-08-30
snapshot: main @ 7aed17a + working tree
---

# Account settings update

Authenticated settings draft → role-aware validation and atomic RPC → updated profile/settings row and refreshed role pages.

## Steps

1. The shared form retains Profile drafts across accessible tab changes and submits every editable value through one action in [SettingsForm](<../../src/components/settings/settings-form.tsx:46>).
2. The Server Action rechecks Supabase claims and the current profile role, runs shared display-name/phone validation, and calls only the authenticated settings RPC in [the settings action](<../../src/app/(protected)/settings/actions.ts:10>).
3. The security-definer RPC repeats normalization and role validation, rejects unauthenticated/invalid requests before mutation, updates `profiles`, and upserts `account_settings` within one transaction in [the migration](<../../supabase/migrations/20261021120000_drop_dark_image_background.sql:3>).
4. The action revalidates the caller's role root and settings page, returns normalized saved values, and the client announces success or failure without discarding unsaved drafts.

## Consumes

- [Profile](../objects/identity/profile.md)
- [Account settings](../objects/runtime/account-settings.md)
- [Shared settings surface](../objects/ui/shared-settings-surface.md)

## Produces

- Normalized display name and one self-private account-settings row.

## If you change this

### Hits

- Shared validation, Server Action result state, RPC authorization/atomicity, both settings routes, and role dashboards.

### Does not hit

- Sign-in email (changed separately by `changeEmailAction`; see the [Shared settings surface](../objects/ui/shared-settings-surface.md)), Professor approval, case bytes/storage authorization, or active model release selection.

## See

[settings Server Action](<../../src/app/(protected)/settings/actions.ts:10>)
