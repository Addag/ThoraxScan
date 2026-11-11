---
node_type: object
universe: live
status: verified
audited: 2026-11-11
snapshot: main @ working tree
---

# Admin action log

`public.admin_actions` records what administrators did: actor, action, target label, detail, and time. Names are snapshotted so entries still read after an account is deleted.

## Shape

- Written only by `private.log_admin_action` inside security-definer functions ([migration](<../../../supabase/migrations/20261111120000_admin_console.sql>)). Professor reviews and administrator grants/removals are logged by triggers on `professor_applications` and `platform_admins`; account and notice RPCs log directly. Capability changes made by operator SQL with no session are not logged.
- Clients have no table grants; administrators read it through `list_admin_actions(max_rows)` on the admin Home page.

## If you change this

Hits the admin Home page, the review and grant/revoke flows (through triggers), and [the pgTAP test](<../../../supabase/tests/database/admin_account_management.test.sql>).
