---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Invitation code

Invitation Code is the hashed, expiring, use-limited `public.invitation_codes` record; the Student application accepts plaintext once and sends only its SHA-256 hash to the RPC.

## Why this shape

Plaintext codes remain outside database records while row locking makes redemption atomic and capped under concurrency.

## Shape

- Hash format, invited role, expiry, active state, and use-limit constraints are defined in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:22>).
- Teaching staff can inspect invitations and manage only permitted invited roles in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:359>).
- Redemption locks the invitation before membership insertion and usage increment in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:387>).
- The Student Server Action validates a 22-character URL-safe code, hashes it, re-derives identity/profile role, calls the RPC, and revalidates `/student` in [actions.ts](<../../../src/app/(protected)/student/actions.ts:11>).

## Connected to

Belongs to [Workspace](workspace.md), is created by a Professor Profile, and produces [Workspace membership](workspace-membership.md).

## If you change this

### Hits

- Invitation constraints/RLS, redemption RPC statuses, Student form validation, action-state messages, and future Professor code management.

### Does not hit

- Activities, inference, or analytics.

## Surfaces

Database, Student redemption form and Server Action, and future Professor invitation controls.

## See

[actions.ts](<../../../src/app/(protected)/student/actions.ts:11>)
