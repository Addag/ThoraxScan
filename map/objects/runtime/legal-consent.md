---
node_type: object
universe: live
status: verified
audited: 2026-10-11
snapshot: working tree @ privacy-consent migration
---

# Legal consent record

`public.legal_consents` is the append-only-ish audit record for privacy-notice acknowledgement.

## Why this shape

The platform must keep the policy version, timestamp, and withdrawal state used to audit each privacy-notice acknowledgement.

## Shape

- The table stores `user_id`, `consent_type`, `document_version`, `accepted_at`, `withdrawn_at`, and `created_at`; `consent_type` allows only `privacy_notice`. Created in [20261010120000_privacy_consents.sql](<../../../supabase/migrations/20261010120000_privacy_consents.sql>) and narrowed in [20261022120000_drop_age_band_and_research_consent.sql](<../../../supabase/migrations/20261022120000_drop_age_band_and_research_consent.sql>).
- `record_registration_consents(input_policy_version)` is an authenticated, security-definer RPC that records one privacy-notice consent per accepted policy version. It accepts only published versions (`1.0`, `1.1`), so a sign-up confirmed after a policy change still records the version shown at registration. Each new policy version needs a migration that adds it.
- Direct client insert/update/delete privileges are revoked; RLS exposes a user's own records for select.
- Registration temporarily carries the policy version through Supabase Auth metadata, and the confirmation route records it after email confirmation in [actions.ts](<../../../src/app/(auth)/actions.ts>) and [route.ts](<../../../src/app/auth/confirm/route.ts>).
- Registration no longer collects an age group or in-app research consent. The 2026-10-22 migration dropped `age_band`, deleted every `research_participation` row, removed `withdraw_research_consent`, and stripped `age_band` and `research_consent` from Auth user metadata.

## Connected to

Owned by the authenticated user and linked to [privacy-policy surface](../ui/privacy-policy.md), [registration](../../processes/registration.md), and confirmation. It is not research consent, guardian verification, clinical consent, or consent from a person depicted in an X-ray.

## If you change this

### Hits

- Migration constraints/RLS/grants, the accepted-version list, Auth metadata, confirmation recording, database tests, and policy version display.

### Does not hit

- Educational account access after registration, X-ray de-identification, provider backup deletion, or the unimplemented academic-term retention job.

## Surfaces

Registration form, Supabase Auth metadata, confirmation route, authenticated Supabase RPC, and privacy-audit administrators.

## See

[Consent migration](<../../../supabase/migrations/20261010120000_privacy_consents.sql>) and [age and research removal](<../../../supabase/migrations/20261022120000_drop_age_band_and_research_consent.sql>)
