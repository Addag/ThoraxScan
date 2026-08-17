---
node_type: contract
status: live
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Processes contract

## Inputs

- Auth UI under ../../src/app/(auth)/ and ../../src/components/auth/.
- Auth/session adapters under ../../src/lib/auth/ and ../../src/lib/supabase/.
- Protected route actions and pages under ../../src/app/(protected)/.
- Auth confirmation route under ../../src/app/auth/confirm/route.ts.

## Job

Record only movements that currently run in the repository. The process shelf covers registration, login and role routing, confirmation and recovery, session protection, and logout.

## Outputs

- [registration.md](registration.md)
- [login-and-role-routing.md](login-and-role-routing.md)
- [confirmation-and-recovery.md](confirmation-and-recovery.md)
- [session-protection.md](session-protection.md)
- [logout.md](logout.md)

The planned workspace, activity, inference, submission, feedback, and evaluation movements remain ghost concepts in the object index and technical references; they do not receive live process cards yet.

## Human check

Every numbered step must point to code or SQL that performs it. If a step exists only in a product or design document, downgrade it to ghost.
