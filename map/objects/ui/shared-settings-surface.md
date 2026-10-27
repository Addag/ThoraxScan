---
node_type: object
universe: live
status: verified
audited: 2026-10-22
snapshot: main @ 583fbab + working tree
---

# Shared settings surface

The shared settings surface is the role-gated `/student/settings` and `/professor/settings` UI for profile and source-backed privacy information, sign-in email and password changes, and per-browser accessibility preferences.

## Why this shape

Student and Professor accounts share one settings contract and visual structure, while the Professor-only phone field and existing role shells preserve the roles' distinct capabilities.

## Shape

- Both thin route pages render one role-aware Server Component that rechecks access, reads Auth email, any pending `new_email`, and self-private settings, and retains the existing Student or Professor shell in [the page wrapper](<../../../src/components/settings/settings-page.tsx:8>).
- One Client Component owns the accessible tablist, retained drafts, pending state, validation messages, and Save Changes action across every tab in [the settings form](<../../../src/components/settings/settings-form.tsx:46>).
- Profile exposes editable display name, read-only sign-in email (with a pending-change note while `new_email` is set), and Professor-only optional work phone; Privacy presents implemented Storage and inference-foundation status without editable controls.
- Security holds two separate forms inside one tabpanel. `changeEmailAction` in [settings actions](<../../../src/app/(protected)/settings/actions.ts>) checks the password through `verify_own_password`, then calls `auth.updateUser({ email })` with a `/auth/confirm?next=/dashboard` redirect. Because `double_confirm_changes` is on, Supabase sends the `email_change` template ([template](<../../../supabase/templates/email_change.html>), a `token_hash` link) to both addresses, and the [confirm route](<../../../src/app/auth/confirm/route.ts>) verifies each one; the `email_changed` notification follows. Email lives only in `auth.users`, so no table needs updating.
- The password form: `changePasswordAction` in [settings actions](<../../../src/app/(protected)/settings/actions.ts>) checks the current password through the `verify_own_password` RPC in [its migration](<../../../supabase/migrations/20261021130000_verify_own_password.sql>) (captcha blocks re-login), then calls `auth.updateUser` and signs out other sessions.
- Accessibility is per browser and has no Save action: Text size radios (Default, Large, Larger) and a High contrast checkbox write `localStorage` and the `data-text-size` / `data-contrast` attributes on `<html>` at once, and the panel reads those attributes back through `useSyncExternalStore` in [the settings form](<../../../src/components/settings/settings-form.tsx>). The CSS and the before-paint script are described in [Design tokens](design-tokens.md).
- Responsive category rows, bordered panels, status treatments, and gradient action are Tailwind utilities in [the settings form](<../../../src/components/settings/settings-form.tsx>) and [the page wrapper](<../../../src/components/settings/settings-page.tsx>).

## Connected to

Edits [Profile](../identity/profile.md) and [Account settings](../runtime/account-settings.md), uses [Design tokens](design-tokens.md), runs [account settings update](../../processes/account-settings-update.md), and extends [Role workspace surfaces](../learning/role-workspace-surface.md).

## If you change this

### Hits

- Both role route pages and navigation active states, shared form draft/tab behavior, settings CSS, validation/error copy, and visual/accessibility checks.

### Does not hit

- Administrator approval, workspace membership authorization, model administration, or future Student AI-analysis controls.

## Surfaces

Authenticated Student and approved-Professor Server Components plus one narrowly scoped Client Component.

## See

[shared settings form](<../../../src/components/settings/settings-form.tsx:46>)
