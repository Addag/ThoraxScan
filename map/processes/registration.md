---
node_type: process
universe: live
status: verified
audited: 2026-10-11
snapshot: working tree @ privacy-consent implementation
---

# Register an account

Form data, requested role, terms agreement, privacy acknowledgement, and Turnstile token → validation and Supabase sign-up → confirmation message, consent recording, and profile/application trigger path.

## Steps

1. The register page renders the shared auth surface with Student and Professor requested-role options plus required terms-agreement and privacy-notice checkboxes in [auth-form.tsx](<../../src/components/auth/auth-form.tsx>).
2. The shared form requires a Cloudflare Turnstile token and resets the single-use challenge after an action response in [auth-form.tsx](<../../src/components/auth/auth-form.tsx:45>).
3. The server action validates the account fields, requires `termsAccepted=yes` and privacy acknowledgement, and rejects a missing Turnstile token before contacting Supabase in [actions.ts](<../../src/app/(auth)/actions.ts>).
4. The action calls Supabase Auth sign-up with the CAPTCHA token, display name, requested role, privacy policy version/date, and `terms_version` and `terms_effective_date` in Auth metadata in [actions.ts](<../../src/app/(auth)/actions.ts>). Terms acceptance is stored in signup metadata only; it is not recorded in `legal_consents` or the confirmation RPC. Audit-grade recording requires a separate migration and RPC change.
5. The Auth trigger creates either a Student profile or a Professor profile plus pending application in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:128>).
6. The confirmation route records the privacy-notice acknowledgement for the metadata policy version through the authenticated consent RPC after email confirmation in [route.ts](<../../src/app/auth/confirm/route.ts>).
7. The action returns role-specific confirmation and Professor-review guidance in [actions.ts](<../../src/app/(auth)/actions.ts>).

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [Profile](../objects/identity/profile.md)
- [Supabase profile schema](../objects/runtime/supabase-profile-schema.md)
- [AppRole](../objects/identity/app-role.md)
- [Privacy policy surface](../objects/ui/privacy-policy.md)
- [Terms and conditions surface](../objects/ui/terms.md)
- [Legal consent record](../objects/runtime/legal-consent.md)

## Produces

- [Auth session and claims](../objects/identity/auth-session.md), after confirmation
- A Student profile, or a Professor profile plus [pending application](../objects/identity/professor-application.md), through the database trigger
- Confirmed privacy-notice records through [consent recording](privacy-consent-recording.md)

## If you change this

### Hits

- Registration fields, CAPTCHA lifecycle, validation messages, metadata names, confirmation destination, and profile creation.
- Auth form role copy and Professor application guidance.
- Consent fields, terms and policy version/date, Auth metadata, and confirmed-account privacy-notice recording.

### Does not hit

- Administrator capability bootstrap or login authorization.
- Workspace membership until an approved user enters a workspace process.
- Research consent, which the capstone evaluation collects outside the app.
- Research-ethics approval, account deletion, and retention enforcement; those remain release blockers or unimplemented procedures.

## See

[actions.ts](<../../src/app/(auth)/actions.ts:65>)
