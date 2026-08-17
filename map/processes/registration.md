---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Register an account

Form data and requested role → validation and Supabase sign-up → confirmation message and profile/application trigger path.

## Steps

1. The register page renders the shared auth surface with Student and Professor requested-role options in [auth-form.tsx](<../../src/components/auth/auth-form.tsx:195>).
2. The server action trims display name and email, validates email and password, and checks the confirmation password in [actions.ts](<../../src/app/(auth)/actions.ts:55>).
3. The action calls Supabase Auth sign-up with display name, requested role, and a confirmation destination in [actions.ts](<../../src/app/(auth)/actions.ts:92>).
4. The Auth trigger creates either a Student profile or a Professor profile plus pending application in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:128>).
5. The action returns role-specific confirmation and Professor-review guidance in [actions.ts](<../../src/app/(auth)/actions.ts:106>).

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [Profile](../objects/identity/profile.md)
- [Supabase profile schema](../objects/runtime/supabase-profile-schema.md)
- [AppRole](../objects/identity/app-role.md)

## Produces

- [Auth session and claims](../objects/identity/auth-session.md), after confirmation
- A Student profile, or a Professor profile plus [pending application](../objects/identity/professor-application.md), through the database trigger

## If you change this

### Hits

- Registration fields, validation messages, metadata names, confirmation destination, and profile creation.
- Auth form role copy and Professor application guidance.

### Does not hit

- Administrator capability bootstrap or login authorization.
- Workspace membership until an approved user enters a workspace process.

## See

[actions.ts](<../../src/app/(auth)/actions.ts:55>)
