---
node_type: surface
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Student and Professor Learning Mode surfaces

The protected `/student/learning` and `/professor/learning` Server Components recheck their respective roles and render the focused Learning Mode analyzer. It presents browser-only practice results, all manifest labels, release/execution provenance, and a V2 attention map when the active release supplies one.

## Connected to

Uses [Built-in X-ray library](../learning/built-in-xray-library.md) as its sample gallery, [Browser inference runtime](../inference/browser-inference-runtime.md), [Local Learning Mode image](../learning/local-learning-mode-image.md), and the Student or Professor shell.

## If you change this

### Hits

- Student and Professor navigation, analyzer states, accessible result focus, responsive styles, and provenance presentation.

### Does not hit

- Activity submissions, grading, uploads, or saved results. Learning Mode heatmaps remain transient in browser memory.

## See

[Student route](<../../../src/app/(protected)/student/learning/page.tsx>), [Professor route](<../../../src/app/(protected)/professor/learning/page.tsx>), and [shared analyzer](<../../../src/components/learning/learning-mode-analyzer.tsx>)
