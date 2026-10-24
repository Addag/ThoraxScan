---
node_type: object
universe: live
status: verified
audited: 2026-10-24
snapshot: main @ 391ebdb + working tree
---

# Administrator approval surface

The `/admin` dashboard is a role-independent, capability-protected surface for reviewing Professor applications.

## Why this shape

The page reuses the established dashboard visual system while keeping review data and mutations behind independent server and database authorization checks.

## Shape

- The page calls `requirePlatformAdmin` before loading the administrator-only application projection in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:35>).
- Per-status counts (shown on the filter chips), status filters, and name/email filtering are derived from the returned projection in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:39>). The projection includes the reviewer's display name since [the reviewer migration](<../../../supabase/migrations/20261024120000_list_professor_applications_reviewer.sql>); approved cards show who reviewed them and when instead of the membership count, and rejected cards show a reviewed line.
- An Administrators section lists capabilities and lets an administrator add one by email or remove another (never themselves), each behind a `ConfirmDialog`, in [administrator-forms.tsx](<../../../src/components/admin/administrator-forms.tsx>) and the grant/revoke actions in [admin/actions.ts](<../../../src/app/(protected)/admin/actions.ts>).
- Approve and Reject both open a `ConfirmDialog` before submitting in [application-review-form.tsx](<../../../src/components/admin/application-review-form.tsx:16>).
- The review Server Action validates form fields, re-derives the caller capability, invokes the RPC, and revalidates affected routes in [admin/actions.ts](<../../../src/app/(protected)/admin/actions.ts:22>). `already_rejected` is reported as "no longer available", not as success.
- Administrator-specific layout and responsive rules are owned by Tailwind utilities in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:35>), [application-review-form.tsx](<../../../src/components/admin/application-review-form.tsx:16>), and [review-styles.ts](<../../../src/components/admin/review-styles.ts:1>); the sidebar comes from the shared [AppShell](<../../../src/components/app-shell.tsx>).

## Connected to

Connected to the [Platform administrator](../identity/platform-administrator.md), [Professor application](../identity/professor-application.md), [authentication surface](auth-surface.md), and [review process](../../processes/professor-application-review.md).

## If you change this

### Hits

- Administrator page/components, review form state, admin-specific CSS, application projection, and review action messages.

### Does not hit

- Student dashboard behavior or approved Professor workspace presentation.

## Surfaces

Authenticated administrator browser UI, server-rendered page, Server Action, and responsive visual QA.

## See

[admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:35>)
