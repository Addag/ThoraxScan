---
node_type: surface
universe: live
status: verified
audited: 2026-10-27
snapshot: main @ 76f6977 + working tree
---

# Attention Maps surface

The protected `/student/attention` and `/professor/attention` Server Components recheck their respective roles and render shared educational content. Both sidebars place Attention maps immediately after Learning mode.

The page describes the 7×7 patch grid, four-layer attention rollout averaged over queries, and per-image normalization. Attention is global and class-agnostic; it does not identify lesions, locate disease, or provide probabilities.

The sample uses `/images/chexpert/cxp-001.jpg` with 49 hand-picked values validated by `readyAttention`. It is explicitly labeled illustrative, not model output. The shared `AttentionHeatmap` uses its illustrative mode with the real blue-to-red smoothed overlay, overlay toggle, opacity slider, legend, and expandable 7×7 table. The content grid becomes one column below 800px.

The PDF Guide opens the committed [attention-maps.pdf](<../../../public/guides/attention-maps.pdf>) in a new tab. It is generated, not hand-made: [render-attention-guide.mjs](<../../../scripts/guides/render-attention-guide.mjs>) prints [attention-maps.html](<../../../scripts/guides/attention-maps.html>) through Playwright Chromium with the LPU letterhead banners (`header.jpg`, `footer.jpg`). Edit the HTML and re-run the script; never edit the PDF. Quick Reference links to Learning Mode for the current role.

## Connected to

[Attention heatmap](../inference/attention-heatmap.md), [Built-in X-ray library](../learning/built-in-xray-library.md), and [Student and Professor Learning Mode](student-learning-mode-surface.md).

## If you change this

### Hits

- Both role routes, sidebar navigation, static educational copy, illustrative heatmap presentation, PDF destination, and responsive layout.
- The PDF copy: its HTML source, letterhead images, and render script, and the committed PDF they regenerate.

### Does not hit

- Model inference, active releases, uploads, activity results, or submissions. This page runs no inference and saves no attention data.

## See

[Shared content](<../../../src/components/learning/attention-maps-content.tsx>), [Student route](<../../../src/app/(protected)/student/attention/page.tsx>), [Professor route](<../../../src/app/(protected)/professor/attention/page.tsx>), [heatmap component](<../../../src/components/attention-heatmap.tsx>), [Student shell](<../../../src/components/student/student-shell.tsx>), [Professor shell](<../../../src/components/professor/professor-shell.tsx>), and [menu icon](../../../public/images/menu-icons/attention.png).
