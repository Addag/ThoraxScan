---
node_type: surface
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Student and Professor Learning Mode surfaces

The protected `/student/learning` and `/professor/learning` Server Components recheck their respective roles and render the focused Learning Mode analyzer. It presents browser-only practice results, all manifest labels, release/execution provenance, and a V2 attention map when the active release supplies one.

Results show "Likely findings" (at or above the threshold). When the release supplies possible thresholds, they also show "Possible findings" (abnormal labels in the band below the threshold), with a warning callout that many of them will be false alarms; a modal with the same caveat opens once per result. Every result opens with an "AI-generated result" banner, an AI-generated radiographic report (type of exam, interpretation, impression from `analysisReport()` in [postprocess.ts](<../../../src/lib/inference/postprocess.ts>); it states only what the 14 labels cover), and a bar chart of all label probabilities with threshold marks. Learning Mode runs the [chest X-ray gate](../learning/chest-gate.md) before inference and refuses images that fail it.

After an analysis of a built-in library case, a "My notes" panel lets the viewer save a private [Learning case note](../learning/learning-case-note.md). Local uploads show a line saying notes need a gallery case.

## Connected to

Uses [Built-in X-ray library](../learning/built-in-xray-library.md) as its sample gallery, [Browser inference runtime](../inference/browser-inference-runtime.md), [Local Learning Mode image](../learning/local-learning-mode-image.md), and the Student or Professor shell.

## If you change this

### Hits

- Student and Professor navigation, analyzer states, accessible result focus, responsive styles, and provenance presentation.
- The findings list is the shared [AnalysisFindings](<../../../src/components/analysis-findings.tsx:10>) component, which the activity AI feedback card also renders; changing it changes both.

### Does not hit

- Activity submissions, grading, uploads, or saved results. Learning Mode images, results and heatmaps remain transient in browser memory; the only write is the viewer's own [Learning case note](../learning/learning-case-note.md).

## See

[Student route](<../../../src/app/(protected)/student/learning/page.tsx>), [Professor route](<../../../src/app/(protected)/professor/learning/page.tsx>), and [shared analyzer](<../../../src/components/learning/learning-mode-analyzer.tsx>)
