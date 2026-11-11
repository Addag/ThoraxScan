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

- Students see published activities with `now − 7 days < due_at ≤ now + 7 days` that they have not submitted. Past-due ones show as a red "Missed deadlines" group (late submissions are refused), and items due within 24 hours are red. Students also see "New feedback": faculty evaluations released in the last 7 days, from `get_student_feedback_notifications` in [the feedback migration](<../../../supabase/migrations/20261111130000_notification_feedback.sql>), keyed by activity id. The loader returns its request time as `now`, so the panel splits missed from upcoming without reading a clock during render. Professors see published activities in workspaces they teach that are due in the same window, plus final submissions from the last 7 days (newest 20) in [the loader](<../../../src/lib/notifications/server.ts:16>).
- Read state is keyed by `(user_id, kind, ref_id)`, where `kind` is `activity_due`, `submission`, or `feedback`. RLS lets users read only their own rows and insert only for activities or submissions their own RLS can see. There is no update or delete grant ([migration](<../../../supabase/migrations/20261023120000_notification_reads.sql:3>)).
- Opening an item marks it read and redirects to a role-derived route. "Mark all read" marks every unread item and refreshes the page ([actions](<../../../src/app/(protected)/actions.ts:15>)).
- The UI is a native Popover API panel with no client JS. It has one panel and two bell buttons: the desktop header and the mobile bar ([component](<../../../src/components/notification-bell.tsx:14>)).

## Connected to

[Activity](activity.md), [Student submission](student-submission.md), [Role workspace surface](role-workspace-surface.md), and `AppShell`/`AppSidebar`.

## If you change this

### Hits

- Student and Professor shells, which fetch the feed on every page render. Also the `AppShell` header, the `AppSidebar` mobile bar, the read-state migration and RLS, and [the pgTAP test](<../../../supabase/tests/database/notification_reads.test.sql>).
- Activity `due_at`/`status`, submission `status`/`submitted_at`, or faculty evaluation `status`/`released_at` semantics, because the feed filters on them.

### Does not hit

- Administrator and pending-Professor application shells (no bell), email or push delivery, and AI feedback.

## Surfaces

Authenticated Server Components and Server Actions on every Student and approved-Professor page.

## See

[notification-bell.tsx](<../../../src/components/notification-bell.tsx>)
