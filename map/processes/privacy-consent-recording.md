---
node_type: process
universe: live
status: verified
audited: 2026-10-11
snapshot: working tree @ privacy-consent implementation
---

# Record registration privacy choices

Registration fields → server validation and Auth metadata → confirmed-account consent RPC → versioned legal-consent records.

## Steps

1. Registration requires privacy-notice acknowledgement in [auth-form.tsx](<../../src/components/auth/auth-form.tsx>) and [actions.ts](<../../src/app/(auth)/actions.ts>). It asks no age group and offers no research consent.
2. The server action rejects a missing notice acknowledgement, then places the policy version/date in Auth metadata.
3. After confirmation, [route.ts](<../../src/app/auth/confirm/route.ts>) calls `record_registration_consents` with the metadata policy version.
4. The RPC records one privacy-notice consent per accepted policy version under the authenticated user and rejects versions that were never published.

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [Privacy policy surface](../objects/ui/privacy-policy.md)
- [Legal consent record](../objects/runtime/legal-consent.md)

## Produces

- Confirmed privacy-notice records in `public.legal_consents`. Research consent for the capstone evaluation is collected outside the app.

## If you change this

### Hits

- Registration validation, consent wording/versioning, Auth metadata, confirmation behavior, RPC grants/RLS, and database tests.

### Does not hit

- Account deletion, one-term deletion/archive enforcement, provider logs/backups, or consent from people depicted in uploaded X-rays.

## See

[registration action](<../../src/app/(auth)/actions.ts>)
