---
node_type: object
universe: live
status: verified
audited: 2026-10-03
snapshot: Convert_to_Tailwind @ 0958975
---

# Shared settings surface

The shared settings surface is the role-gated `/student/settings` and `/professor/settings` UI for profile, display, and source-backed privacy information.

## Why this shape

Student and Professor accounts share one settings contract and visual structure, while the Professor-only phone field and existing role shells preserve the roles' distinct capabilities.

## Shape

- Both thin route pages render one role-aware Server Component that rechecks access, reads Auth email plus self-private settings, and retains the existing Student or Professor shell in [the page wrapper](<../../../src/components/settings/settings-page.tsx:8>).
- One Client Component owns the accessible tablist, retained drafts, pending state, validation messages, and Save Changes action across every tab in [the settings form](<../../../src/components/settings/settings-form.tsx:46>).
- Profile exposes editable display name, read-only sign-in email, and Professor-only optional work phone; Display exposes the persisted teaching-image frame switch; Privacy presents implemented Storage and inference-foundation status without editable controls.
- Responsive category rows, bordered panels, status treatments, switch, gradient action, and image-frame variants live in [global settings styles](<../../../src/app/globals.css:3609>).

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
