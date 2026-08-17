---
node_type: contract
status: live
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Processes contract

## Inputs

- Auth UI under ../../src/app/(auth)/ and ../../src/components/auth/.
- Auth/session adapters under ../../src/lib/auth/ and ../../src/lib/supabase/.
- Protected route actions and pages under ../../src/app/(protected)/.
- Workspace data projections under ../../src/lib/workspaces/.
- Workspace schema, authorization helpers, triggers, and RPC under ../../supabase/migrations/.
- Auth confirmation route under ../../src/app/auth/confirm/route.ts.

## Job

Record only movements that currently run in the repository. The process shelf covers authentication, Professor approval, workspace creation, invitation management, roster management, and membership exit contracts.

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

Activity, inference, submission, feedback, and evaluation movements remain ghost concepts in the object index and technical references; they do not receive live process cards yet.

## Human check

Every numbered step must point to code or SQL that performs it. If a step exists only in a product or design document, downgrade it to ghost.
