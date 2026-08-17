---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Invitation redemption

Student plaintext invitation → SHA-256 hash and locked RPC validation → idempotent Workspace membership and refreshed dashboard.

## Steps

1. The client form submits a 22-character code through `useActionState` in [invitation-form.tsx](<../../src/components/student/invitation-form.tsx:7>).
2. The Server Action re-derives claims and the Student profile, hashes the code, and calls the redemption RPC in [actions.ts](<../../src/app/(protected)/student/actions.ts:11>).
3. The RPC locks the matching invitation before checking role, existing membership, active state, expiry, and uses in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:387>).
4. A new membership and incremented use count commit in the same RPC transaction; an existing member returns without another use in [workspace migration](<../../supabase/migrations/20260817110952_workspace_membership_invitations.sql:423>).
5. Success revalidates `/student`, where joined workspaces are queried and rendered in [student page](<../../src/app/(protected)/student/page.tsx:13>).

## Consumes

- [Invitation code](../objects/learning/invitation-code.md)
- [Profile](../objects/identity/profile.md)

## Produces

- [Workspace membership](../objects/learning/workspace-membership.md)
- [Role workspace surface](../objects/learning/role-workspace-surface.md)

## If you change this

### Hits

- Code validation, hash contract, RPC status mapping, concurrency limits, and dashboard revalidation.

### Does not hit

- Invitation creation or plaintext recovery; recovery is not implemented.

## See

[actions.ts](<../../src/app/(protected)/student/actions.ts:11>)
