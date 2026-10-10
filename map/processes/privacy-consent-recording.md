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

1. Registration requires an age band and privacy-notice acknowledgement; research consent is a separate unticked option in [auth-form.tsx](<../../src/components/auth/auth-form.tsx>) and [actions.ts](<../../src/app/(auth)/actions.ts>).
2. The server action rejects missing notice acknowledgement, invalid age bands, and research consent from minors until the guardian process is approved, then places the policy version/date and research choice in Auth metadata.
3. After confirmation, [route.ts](<../../src/app/auth/confirm/route.ts>) calls `record_registration_consents` using that metadata.
4. The RPC records a privacy-notice consent and optional research consent under the authenticated user; a separate RPC can withdraw active research consent.

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [Privacy policy surface](../objects/ui/privacy-policy.md)
- [Legal consent record](../objects/runtime/legal-consent.md)

## Produces

- Confirmed user consent records in `public.legal_consents`.
- A release-blocker signal for guardian verification and research/privacy approval; no guardian consent is currently recorded.

## If you change this

### Hits

- Registration validation, consent wording/versioning, Auth metadata, confirmation behavior, RPC grants/RLS, and database tests.

### Does not hit

- Account deletion, one-term deletion/archive enforcement, provider logs/backups, or consent from people depicted in uploaded X-rays.

## See

[registration action](<../../src/app/(auth)/actions.ts>)
