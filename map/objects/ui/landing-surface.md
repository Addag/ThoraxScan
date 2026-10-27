---
node_type: object
universe: live
status: verified
audited: 2026-10-27
snapshot: main @ 76f6977 + working tree
---

# Landing surface

The public landing page introduces ThoraxScan, links to login, shows a static X-ray preview, and displays the non-diagnostic disclaimer. A "See how it works" link at the hero's bottom center scrolls to four sections below it: the learning loop, the Student and Professor roles, the model ("Under the hood"), and a final Log in / Register call to action.

## Why this shape

It is the public entry point and establishes the educational, non-clinical product boundary before authentication.

## Shape

- Renders the brand, product copy, workflow callouts, static image, and login link in [page.tsx](<../../../src/app/page.tsx>).
- The disclaimer states that AI outputs are for guided learning and not clinical diagnosis or patient care in [page.tsx](<../../../src/app/page.tsx>). It sits at the bottom of the one-screen hero; a page footer repeats it with the Privacy Policy and Terms links.
- Section copy lives in `const` arrays at the top of [page.tsx](<../../../src/app/page.tsx>). "Under the hood" shows one figure, `modelScore` (v5 competition AUC 0.881 on the official 234), from [Model training](../inference/model-training.md). It also renders the shared `AttentionHeatmap` in illustrative mode with `illustrativeAttention`, exported from [attention-maps-content.tsx](<../../../src/components/learning/attention-maps-content.tsx>), and links the [attention maps PDF](attention-maps-surface.md).

Styling lives in Tailwind utilities in [page.tsx](<../../../src/app/page.tsx>), with landing tokens, exact inclusive responsive/supports variants, the `[data-landing]` background (sized to one screen so the hero's gradients don't stretch) and smooth anchor scrolling (off under reduced motion) in [globals.css](<../../../src/app/globals.css>).

## Connected to

The [authentication surface](auth-surface.md), [design tokens](design-tokens.md), brand component, X-ray sample asset, [attention heatmap](../inference/attention-heatmap.md), and [Attention maps surface](attention-maps-surface.md).

## If you change this

### Hits

- Public navigation and educational-scope copy.
- Landing layout tokens and referenced image assets.
- `modelScore` must follow [Model training](../inference/model-training.md) when the active release changes.
- Changing the illustrative attention values or `AttentionHeatmap` changes both this page and the Attention maps surface.

### Does not hit

- Actual model inference or LMS workflows; the landing copy names future capabilities but does not implement them.

## Surfaces

Public browser route /, unauthenticated users, and visual QA.

## See

[page.tsx](<../../../src/app/page.tsx>)
