---
node_type: process
universe: live
status: verified
audited: 2026-08-22
snapshot: main @ 59e6d7d + working tree
---

# Register an account

Form data, requested role, and Turnstile token → validation and Supabase sign-up → confirmation message and profile/application trigger path.

## Steps

1. The register page renders the shared auth surface with Student and Professor requested-role options in [auth-form.tsx](<../../src/components/auth/auth-form.tsx:281>).
2. The shared form requires a Cloudflare Turnstile token and resets the single-use challenge after an action response in [auth-form.tsx](<../../src/components/auth/auth-form.tsx:45>).
3. The server action trims display name and email, validates email and password, checks the confirmation password, and rejects a missing Turnstile token before contacting Supabase in [actions.ts](<../../src/app/(auth)/actions.ts:65>).
4. The action calls Supabase Auth sign-up with the CAPTCHA token, display name, requested role, and a confirmation destination in [actions.ts](<../../src/app/(auth)/actions.ts:104>).
5. The Auth trigger creates either a Student profile or a Professor profile plus pending application in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:128>).
6. The action returns role-specific confirmation and Professor-review guidance in [actions.ts](<../../src/app/(auth)/actions.ts:122>).

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

- Registration fields, CAPTCHA lifecycle, validation messages, metadata names, confirmation destination, and profile creation.
- Auth form role copy and Professor application guidance.

### Does not hit

- Administrator capability bootstrap or login authorization.
- Workspace membership until an approved user enters a workspace process.

## See

[actions.ts](<../../src/app/(auth)/actions.ts:65>)
