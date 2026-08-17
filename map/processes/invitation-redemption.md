---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Invitation redemption

Student or approved-Professor plaintext invitation → SHA-256 hash and locked RPC validation → idempotent Workspace membership and refreshed role dashboard.

## Steps

1. Student and Professor client forms submit a 22-character code through `useActionState` in [student invitation-form.tsx](<../../src/components/student/invitation-form.tsx:7>) and [Professor forms](<../../src/components/professor/professor-forms.tsx:55>).
2. Each Server Action re-derives claims and role access, hashes the code, and invokes the RPC in [student actions](<../../src/app/(protected)/student/actions.ts:11>) and [Professor actions](<../../src/app/(protected)/professor/actions.ts:249>).
3. The current RPC derives an approval-aware caller role, locks the invitation, then checks invited role, membership, active state, expiry, and uses in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:466>) and [locked lookup](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:492>).
4. A new membership and incremented use count commit in the same RPC transaction; an existing member returns without another use in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:527>).
5. Success revalidates the caller's role dashboard, where joined workspaces are queried and rendered by the corresponding protected page in [Student actions](<../../src/app/(protected)/student/actions.ts:64>) and [Professor actions](<../../src/app/(protected)/professor/actions.ts:272>).

## Consumes

- [Invitation code](../objects/learning/invitation-code.md)
- [Profile](../objects/identity/profile.md)
- [Professor application](../objects/identity/professor-application.md)

## Produces

- [Workspace membership](../objects/learning/workspace-membership.md)
- [Role workspace surface](../objects/learning/role-workspace-surface.md)

## If you change this

### Hits

- Code validation, hash contract, approval-aware caller-role derivation, RPC status mapping, concurrency limits, and both dashboard revalidation paths.

### Does not hit

- Invitation creation or plaintext recovery; recovery is not implemented.

## See

[redemption RPC](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:466>)
