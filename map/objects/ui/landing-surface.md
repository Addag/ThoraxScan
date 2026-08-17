---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Landing surface

The public landing page introduces ThoraxScan, links to login, shows a static X-ray preview, and displays the non-diagnostic disclaimer.

## Why this shape

It is the public entry point and establishes the educational, non-clinical product boundary before authentication.

## Shape

- Renders the brand, product copy, workflow callouts, static image, and login link in [page.tsx](<../../../src/app/page.tsx:12>).
- The disclaimer states that AI outputs are for guided learning and not clinical diagnosis or patient care in [page.tsx](<../../../src/app/page.tsx:63>).

## Connected to

The [authentication surface](auth-surface.md), [design tokens](design-tokens.md), brand component, and X-ray sample asset.

## If you change this

### Hits

- Public navigation and educational-scope copy.
- Landing layout tokens and referenced image assets.

### Does not hit

- Actual model inference or LMS workflows; the landing copy names future capabilities but does not implement them.

## Surfaces

Public browser route /, unauthenticated users, and visual QA.

## See

[page.tsx](<../../../src/app/page.tsx:12>)
