---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Register a student account

Form data → validation and Supabase sign-up → confirmation message and profile-trigger path.

## Steps

1. The register page renders the shared auth surface with mode register.
2. The server action trims display name and email, validates email and password, and checks the confirmation password in [actions.ts](<../../src/app/(auth)/actions.ts:46>).
3. The action calls Supabase Auth signUp with display_name metadata and a confirmation destination in [actions.ts](<../../src/app/(auth)/actions.ts:76>).
4. The Auth database trigger creates a student profile from that metadata in [the migration](<../../supabase/migrations/20260810163915_auth_profiles.sql:30>).
5. The action returns a success message asking the user to confirm the email in [actions.ts](<../../src/app/(auth)/actions.ts:94>).

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [Profile](../objects/identity/profile.md)
- [Supabase profile schema](../objects/runtime/supabase-profile-schema.md)

## Produces

- [Auth session and claims](../objects/identity/auth-session.md), after confirmation
- A profile row, through the database trigger

## If you change this

### Hits

- Registration fields, validation messages, metadata names, confirmation destination, and profile creation.
- Auth form role copy, because public registration creates student accounts.

### Does not hit

- Login role mismatch behavior after the profile contract remains unchanged.
- Planned workspace membership or invitation records.

## See

[actions.ts](<../../src/app/(auth)/actions.ts:46>)
