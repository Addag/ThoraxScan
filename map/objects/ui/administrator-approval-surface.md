---
node_type: object
universe: live
status: verified
audited: 2026-10-24
snapshot: main @ 391ebdb + working tree
---

# Administrator approval surface

The `/admin` area is a role-independent, capability-protected console. Home (`/admin`) shows platform totals, a per-Professor report with CSV export (`/admin/report`), a platform activity feed, and the [admin action log](../runtime/admin-action-log.md). Applications (`/admin/applications`) reviews Professor applications. Accounts (`/admin/accounts`) manages accounts and administrators. Notices (`/admin/notices`) posts [site notices](../runtime/site-notice.md). `AdminShell` takes an `activeItem` for the four nav entries.

## Why this shape

The page reuses the established dashboard visual system while keeping review data and mutations behind independent server and database authorization checks.

## Shape

- Every page calls `requirePlatformAdmin`; the applications page loads the administrator-only application projection in [applications/page.tsx](<../../../src/app/(protected)/admin/applications/page.tsx>).
- Accounts lists `list_accounts()` with search and role/disabled filters. A `<details>` panel per account (never your own) offers rename, temporary password, sign out everywhere, disable/enable sign-in, and delete, all through one `manageAccountAction` whose hidden `op` picks the RPC in [the admin console migration](<../../../supabase/migrations/20261111120000_admin_console.sql>). Delete returns `has_records` when restrict foreign keys block it (workspaces, activities, submissions, analyses, evaluations); the UI suggests disabling instead. Password-reset emails are not used because captcha guards Supabase Auth. Disabling sets `banned_until` and deletes sessions; tokens already issued still work until they expire.
- Home reads `get_platform_stats`, `list_professor_report`, `list_platform_events`, and `list_admin_actions`, all administrator-only.
- Per-status counts (shown on the filter chips), status filters, and name/email filtering are derived from the returned projection in [applications/page.tsx](<../../../src/app/(protected)/admin/applications/page.tsx:56>). The projection includes the reviewer's display name since [the reviewer migration](<../../../supabase/migrations/20261024120000_list_professor_applications_reviewer.sql>); approved cards show who reviewed them and when instead of the membership count, and rejected cards show a reviewed line.
- An Administrators section on the Accounts page lists capabilities and lets an administrator add one by email or remove another (never themselves), each behind a `ConfirmDialog`, in [administrator-forms.tsx](<../../../src/components/admin/administrator-forms.tsx>) and the grant/revoke actions in [admin/actions.ts](<../../../src/app/(protected)/admin/actions.ts>).
- Approve and Reject both open a `ConfirmDialog` before submitting in [application-review-form.tsx](<../../../src/components/admin/application-review-form.tsx:16>).
- The review Server Action validates form fields, re-derives the caller capability, invokes the RPC, and revalidates `/admin` as a layout so every admin page refreshes in [admin/actions.ts](<../../../src/app/(protected)/admin/actions.ts:22>). `already_rejected` is reported as "no longer available", not as success.
- Administrator-specific layout and responsive rules are owned by Tailwind utilities in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx>), [applications/page.tsx](<../../../src/app/(protected)/admin/applications/page.tsx>), [application-review-form.tsx](<../../../src/components/admin/application-review-form.tsx:16>), and [review-styles.ts](<../../../src/components/admin/review-styles.ts:1>); the sidebar comes from the shared [AppShell](<../../../src/components/app-shell.tsx>).

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

[admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx>)
