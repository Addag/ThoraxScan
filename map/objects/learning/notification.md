---
node_type: object
universe: live
status: verified
audited: 2026-10-23
snapshot: main @ working tree
---

# Bell notification

A bell notification is a read-time projection over published activities and final submissions, plus one stored per-user read marker in `public.notification_reads`.

## Why this shape

Dues and submissions already live in their own tables, so the feed is derived when the page renders instead of fanned out into notification rows. Only "seen" state needs storage.

## Shape

- Students see published activities with `now < due_at ≤ now + 7 days` that they have not submitted. Professors see published activities in workspaces they teach that are due in the same window, plus final submissions from the last 7 days (newest 20) in [the loader](<../../../src/lib/notifications/server.ts:16>).
- Read state is keyed by `(user_id, kind, ref_id)`, where `kind` is `activity_due` or `submission`. RLS lets users read only their own rows and insert only for activities or submissions their own RLS can see. There is no update or delete grant ([migration](<../../../supabase/migrations/20261023120000_notification_reads.sql:3>)).
- Opening an item marks it read and redirects to a role-derived route. "Mark all read" marks every unread item and refreshes the page ([actions](<../../../src/app/(protected)/actions.ts:15>)).
- The UI is a native Popover API panel with no client JS. It has one panel and two bell buttons: the desktop header and the mobile bar ([component](<../../../src/components/notification-bell.tsx:14>)).

## Connected to

[Activity](activity.md), [Student submission](student-submission.md), [Role workspace surface](role-workspace-surface.md), and `AppShell`/`AppSidebar`.

## If you change this

### Hits

- Student and Professor shells, which fetch the feed on every page render. Also the `AppShell` header, the `AppSidebar` mobile bar, the read-state migration and RLS, and [the pgTAP test](<../../../supabase/tests/database/notification_reads.test.sql>).
- Activity `due_at`/`status` or submission `status`/`submitted_at` semantics, because the feed filters on them.

### Does not hit

- Administrator and pending-Professor application shells (no bell), email or push delivery, faculty evaluation release, and AI feedback.

## Surfaces

Authenticated Server Components and Server Actions on every Student and approved-Professor page.

## See

[notification-bell.tsx](<../../../src/components/notification-bell.tsx>)
