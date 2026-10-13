---
node_type: object
universe: live
status: verified
audited: 2026-10-13
snapshot: working tree @ terms implementation
---

# Terms and conditions surface

The terms surface is the public `/terms` page and its shared legal links.

## Why this shape

The terms define educational use, account responsibilities, content permissions, and service limitations. Registration requires agreement; the version and effective date are stored in signup metadata only.

## Shape

- The page identifies version `1.0`, effective date `2026-10-13`, operator/contact placeholders, educational limits, account eligibility, acceptable use, role responsibilities, separate research, intellectual property, availability, termination, liability, and a governing-law placeholder in [page.tsx](<../../../src/app/terms/page.tsx>).
- Shared legal constants and existing operator/contact placeholders are owned by [privacy.ts](<../../../src/lib/legal/privacy.ts>).
- Landing, authentication, protected-shell, and Privacy Policy navigation link to the page in [page.tsx](<../../../src/app/page.tsx>), [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx>), [app-shell.tsx](<../../../src/components/app-shell.tsx>), and [privacy-policy/page.tsx](<../../../src/app/privacy-policy/page.tsx>).
- The registration checkbox and server validation require `termsAccepted=yes`; sign-up includes `terms_version` and `terms_effective_date` in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx>) and [actions.ts](<../../../src/app/(auth)/actions.ts>).
- Operator identity, contact information, governing law, and legal/institutional review remain public-launch placeholders. The Philippines is proposed, not confirmed.

## Connected to

Connects to [authentication surface](auth-surface.md), [registration](../../processes/registration.md), and [Privacy Policy](privacy-policy.md). Terms acceptance is separate from privacy acknowledgement and optional research participation.

## If you change this

### Hits

- Public legal navigation, registration agreement wording and validation, signup metadata version/date, and legal/accessibility smoke checks.
- Public-launch review of the operator, contact, and governing-law placeholders.

### Does not hit

- `legal_consents`, the consent-recording RPC, database schema, or migrations. Audit-grade terms acceptance records require a separate migration and recording change.
- Supabase permissions or provider settings.

## Surfaces

Public browser route, authenticated legal navigation, registrants, account holders, professors, and administrators.

## See

[Terms page](<../../../src/app/terms/page.tsx>)
