---
node_type: object
universe: live
status: verified
audited: 2026-10-11
snapshot: working tree @ privacy-consent migration
---

# Legal consent record

`public.legal_consents` is the append-only-ish audit record for privacy-notice acknowledgement and voluntary research consent.

## Why this shape

The platform must distinguish required notice acknowledgement from optional research participation and retain the policy version, age band, timestamp, and withdrawal state used to audit that choice.

## Shape

- The table stores `user_id`, `consent_type`, `document_version`, `age_band`, `accepted_at`, `withdrawn_at`, and `created_at` in [20261010120000_privacy_consents.sql](<../../../supabase/migrations/20261010120000_privacy_consents.sql>).
- `record_registration_consents` is an authenticated, security-definer RPC that records privacy notice consent and optional research consent; it rejects minor research consent until an approved guardian process exists.
- `withdraw_research_consent` marks the caller's active research consent withdrawn. Direct client insert/update/delete privileges are revoked; RLS exposes a user's own records for select.
- Registration temporarily carries consent metadata through Supabase Auth and the confirmation route records it after email confirmation in [actions.ts](<../../../src/app/(auth)/actions.ts>), [auth-form.tsx](<../../../src/components/auth/auth-form.tsx>), and [route.ts](<../../../src/app/auth/confirm/route.ts>).

## Connected to

Owned by the authenticated user and linked to [privacy-policy surface](../ui/privacy-policy.md), [registration](../../processes/registration.md), and confirmation. It is not guardian verification, clinical consent, or consent from a person depicted in an X-ray.

## If you change this

### Hits

- Migration constraints/RLS/grants, registration fields and validation, Auth metadata, confirmation recording, research withdrawal, database tests, and policy version display.

### Does not hit

- Educational account access after registration, X-ray de-identification, provider backup deletion, or the unimplemented academic-term retention job.

## Surfaces

Registration form, Supabase Auth metadata, confirmation route, authenticated Supabase RPCs, and privacy-audit administrators.

## See

[Consent migration](<../../../supabase/migrations/20261010120000_privacy_consents.sql>)
