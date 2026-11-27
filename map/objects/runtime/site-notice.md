---
node_type: object
universe: live
status: verified
audited: 2026-11-11
snapshot: main @ working tree
---

# Site notice

A site notice is an administrator-posted banner (`info` or `warning`, up to 300 characters, optional end time) stored in `public.site_announcements`.

## Shape

- Anon and authenticated users can select only active rows (`ends_at` null or in the future). Writes go through `post_site_announcement` and `remove_site_announcement`, which check for an administrator and log to the [admin action log](admin-action-log.md) ([migration](<../../../supabase/migrations/20261111120000_admin_console.sql>)).
- [SiteAnnouncements](<../../../src/components/site-announcements.tsx>) renders them at the top of `AppShell` (every Student, Professor, and administrator page) and `AuthLayout` (login, register, forgot, reset). The public landing, privacy, and terms pages do not show them.

## If you change this

Hits the admin Notices page, `AppShell`, `AuthLayout`, and [the pgTAP test](<../../../supabase/tests/database/admin_account_management.test.sql>).
