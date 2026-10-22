---
node_type: object
universe: live
status: verified
audited: 2026-10-11
snapshot: working tree @ privacy-policy implementation
---

# Privacy policy surface

The privacy-policy surface is the public `/privacy-policy` page and its shared legal links.

## Why this shape

The notice is a public, versioned disclosure for account, educational, teaching-case, AI, security, and provider processing. It is a notice, not proof that every described operational control is already live.

## Shape

- The page identifies version `1.1`, effective date `2026-10-22`, controller/address/contact placeholders, purposes, provider disclosures, international processing, retention limitations, rights, age and research participation, and medical-use limits in [page.tsx](<../../../src/app/privacy-policy/page.tsx>).
- Section 8 states that the app asks no age, that under-18 use follows the institution, and that registration does not enroll anyone in research; the capstone evaluation asks for its own consent.
- Shared legal constants are owned by [privacy.ts](<../../../src/lib/legal/privacy.ts>).
- Landing, authentication, protected-shell, and settings navigation link to the page in [page.tsx](<../../../src/app/page.tsx>), [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx>), [app-shell.tsx](<../../../src/components/app-shell.tsx>), and [settings-form.tsx](<../../../src/components/settings/settings-form.tsx>).
- Operator identity, address, privacy email, institutional approval, and verified retention enforcement remain release blockers; the page labels them instead of asserting completion.

## Connected to

Connects to [authentication surface](auth-surface.md), [registration](../../processes/registration.md), [legal consent](../runtime/legal-consent.md), and [X-ray case](../learning/xray-case.md). It describes provider processing and points research consent to the separate capstone evaluation, but does not implement provider configuration or retention deletion.

## If you change this

### Hits

- Public legal navigation, registration acknowledgement version/date, privacy contact details, provider disclosures, retention wording, and legal/accessibility smoke tests.
- The release checklist for research approval and retention-job verification.

### Does not hit

- Supabase permissions, provider settings, or automatic deletion unless their source contracts are changed separately.

## Surfaces

Public browser route, authenticated legal navigation, registrants, account holders, professors, administrators, and privacy-request reviewers.

## See

[Privacy policy page](<../../../src/app/privacy-policy/page.tsx>)
