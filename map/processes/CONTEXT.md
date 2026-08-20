---
node_type: contract
status: live
audited: 2026-08-20
snapshot: main @ ed26b07 + working tree
---

# Processes contract

## Inputs

- Auth UI under ../../src/app/(auth)/ and ../../src/components/auth/.
- Auth/session adapters under ../../src/lib/auth/ and ../../src/lib/supabase/.
- Protected route actions and pages under ../../src/app/(protected)/.
- Workspace data projections under ../../src/lib/workspaces/.
- Activity data projections under ../../src/lib/activities/ and activity UI under ../../src/components/activities/.
- Workspace schema, authorization helpers, triggers, and RPC under ../../supabase/migrations/.
- Activity/case schema, lifecycle triggers, RLS, and Storage policies under ../../supabase/migrations/20260820101401_activities_case_publication.sql.
- Auth confirmation route under ../../src/app/auth/confirm/route.ts.

## Job

Record only movements that currently run in the repository. The process shelf covers authentication, Professor approval, workspace membership/rosters, Professor activity publication, and Student activity viewing.

## Outputs

- [registration.md](registration.md)
- [professor-application-review.md](professor-application-review.md)
- [login-and-role-routing.md](login-and-role-routing.md)
- [confirmation-and-recovery.md](confirmation-and-recovery.md)
- [session-protection.md](session-protection.md)
- [logout.md](logout.md)
- [workspace-creation.md](workspace-creation.md)
- [invitation-redemption.md](invitation-redemption.md)
- [roster-management.md](roster-management.md)
- [membership-exit.md](membership-exit.md)
- [activity-authoring-publication.md](activity-authoring-publication.md)
- [student-activity-view.md](student-activity-view.md)

Inference, Student submission, AI feedback release, faculty evaluation, analytics, and notification movements remain ghost concepts; they do not receive live process cards.

## Human check

Every numbered step must point to code or SQL that performs it. If a step exists only in a product or design document, downgrade it to ghost.
