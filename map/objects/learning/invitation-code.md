---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Invitation code

Invitation Code is the hashed, expiring, use-limited `public.invitation_codes` record; Professor actions generate 128-bit plaintext once, and both roles send only SHA-256 hashes to the redemption RPC.

## Why this shape

Plaintext codes remain outside database records while row locking makes redemption atomic and capped under concurrency.

## Shape

- Hash format, invited role, expiry, active state, and use-limit constraints are defined in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:22>).
- Teaching staff can inspect invitations and manage only permitted invited roles in [workspace migration](<../../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:359>).
- The current redemption RPC derives an approval-aware caller role and locks the invitation before membership insertion and usage increment in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:466>).
- The Student Server Action validates a 22-character URL-safe code, hashes it, re-derives identity/profile role, calls the RPC, and revalidates `/student` in [actions.ts](<../../../src/app/(protected)/student/actions.ts:11>).
- The Professor Server Action derives owner/co-professor access, generates 16 random bytes, stores only the hash, and returns plaintext only in its success state in [professor/actions.ts](<../../../src/app/(protected)/professor/actions.ts:147>).

## Connected to

Belongs to [Workspace](workspace.md), is created by an approved Professor [Profile](../identity/profile.md), and produces [Workspace membership](workspace-membership.md); Professor redemption depends on [Professor application](../identity/professor-application.md) approval.

## If you change this

### Hits

- Invitation constraints/RLS, approval-aware caller-role derivation, redemption RPC statuses, both role redemption forms, copy-once results, and Professor create/revoke management.

### Does not hit

- Activities, inference, or analytics.

## Surfaces

Database, both role redemption forms/actions, and Professor invitation creation/revocation controls.

## See

[professor/actions.ts](<../../../src/app/(protected)/professor/actions.ts:147>)
