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
- The header (in-page "How it works", "Technical" and "Docs" links; only Docs below 480px), footer, and section styles come from [landing-ui.tsx](<../../../src/components/landing-ui.tsx>).
- `#docs` is the documentation, after parada-landing's Docs page, in [docs-section.tsx](<../../../src/components/docs-section.tsx>). It has two groups of native `<details>` topics: "Using ThoraxScan" (account, joining, activities, feedback, Learning Mode, class setup, publishing, review and analytics, settings) and "For developers" (layout, data flow, setup, running and testing, model releases, administrators, deployment). Each topic ends with a Source line linking the repo files it restates on `github.com/Addag/ThoraxScan` (`repoFile`). Those links 404 for visitors while the repository is private. Developer topics use README.md, `.env.example` (variable names only), package.json, docs/model-releases.md and supabase/README.md, but not that README's stale "registration always creates a student" section.
- `#technical` is the technical overview, after parada-landing's technical tab, in [technical-overview.tsx](<../../../src/components/technical-overview.tsx>). It covers architecture, features by module, model details, stack, security, build status (implemented vs continuing), and the academic note. Its copy restates live cards: [Model training](../inference/model-training.md), [Browser inference runtime](../inference/browser-inference-runtime.md), [Model release](../inference/model-release.md), [X-ray case](../learning/xray-case.md), [Invitation code](../learning/invitation-code.md), [Platform administrator](../identity/platform-administrator.md), the submission, feedback and evaluation cards, and package.json. The "continuing" list draws on the capstone record's untested local-only claim, the frontal-only activity scope (laterals are supported in Learning Mode only), the Terms review notice, and the capstone record's usability evaluation under an approved research protocol. Class analytics now sits in the implemented list.
- Section copy lives in `const` arrays at the top of [page.tsx](<../../../src/app/page.tsx>). "Under the hood" shows one figure, `modelScore` (v7 competition AUC 0.880 on the official 234), from [Model training](../inference/model-training.md). It also renders the shared `AttentionHeatmap` with the real sample maps `sampleHeatmap`/`sampleHeatmapLabels`, exported from [attention-maps-content.tsx](<../../../src/components/learning/attention-maps-content.tsx>), and links the [attention maps PDF](attention-maps-surface.md).

Styling lives in Tailwind utilities in [page.tsx](<../../../src/app/page.tsx>), with landing tokens, exact inclusive responsive/supports variants, the `[data-landing]` background (sized to one screen so the hero's gradients don't stretch) and smooth anchor scrolling (off under reduced motion) in [globals.css](<../../../src/app/globals.css>). Below the hero, headings, leads and cards carry `data-reveal`: a play-once fade-up. [reveal-on-scroll.tsx](<../../../src/components/reveal-on-scroll.tsx>) observes them, staggers elements that arrive together by 120ms, and sets `data-shown`; the hiding and transition rules live in globals.css. Without script or under reduced motion nothing is hidden. An element whose own Tailwind `transition` utility would override the reveal (the pill links) is wrapped instead of marked.

## Connected to

The [authentication surface](auth-surface.md), [design tokens](design-tokens.md), brand component, X-ray sample asset, [attention heatmap](../inference/attention-heatmap.md), and [Attention maps surface](attention-maps-surface.md).

## If you change this

### Hits

- Public navigation and educational-scope copy.
- Landing layout tokens and referenced image assets.
- `modelScore` and the technical overview's `modelDetails` must follow [Model training](../inference/model-training.md) when the active release changes.
- The technical overview's features, security and status copy must follow the cards it restates (a new control, a ghost feature that ships).
- A docs topic must follow the files in its Source line. A changed user flow (process card), npm script, env variable or release command changes that topic.
- Changing the sample heatmap (`sample-heatmap.json`) or `AttentionHeatmap` changes both this page and the Attention maps surface.

### Does not hit

- Actual model inference or LMS workflows; the landing copy names future capabilities but does not implement them.

## Surfaces

Public browser route /, unauthenticated users, and visual QA.

## See

[page.tsx](<../../../src/app/page.tsx>)
