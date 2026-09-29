---
node_type: surface
universe: live
status: verified
audited: 2026-09-17
snapshot: working tree
---

# Student Learning Mode surface

The protected `/student/learning` Server Component rechecks the Student role and renders the focused Learning Mode analyzer. It presents browser-only practice results, all manifest labels, and release/execution provenance.

## Connected to

Uses [Built-in X-ray library](../learning/built-in-xray-library.md) as its sample gallery, [Browser inference runtime](../inference/browser-inference-runtime.md), [Local Learning Mode image](../learning/local-learning-mode-image.md), and the Student or Professor shell.

## If you change this

### Hits

- Student and Professor navigation, analyzer states, accessible result focus, responsive styles, and provenance presentation.

### Does not hit

- Activity submissions, grading, uploads, heatmaps, or saved results.

## See

[Learning route](../../../src/app/(protected)/student/learning/page.tsx)
