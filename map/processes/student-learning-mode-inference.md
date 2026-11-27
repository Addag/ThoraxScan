---
node_type: process
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Student Learning Mode inference

1. The Student and Professor routes are protected with `requireRole("student")` and `requireRole("professor")` respectively.
2. The analyzer validates a selected JPEG or PNG (local file or [built-in library](../objects/learning/built-in-xray-library.md) case), previews it locally, and retains it only in browser memory.
3. Analyze dynamically loads the inference runtime, resolves the active release through Supabase, verifies the model artifact, preprocesses the image, and runs WASM with one thread.
4. The client renders thresholded findings, all manifest labels, suppression state, provenance, a V2 attention map when available, and a non-diagnostic disclaimer.
5. Reset aborts the active run and invalidates stale completions; no Storage, submission, or saved-analysis write occurs.
6. For a library case, the viewer may save a private [Learning case note](../objects/learning/learning-case-note.md) after the result renders; this is the only database write, and it holds the viewer's text, not the prediction.

## Consumes

- [Student Learning Mode surface](../objects/ui/student-learning-mode-surface.md)
- [Local Learning Mode image](../objects/learning/local-learning-mode-image.md)
- [Browser inference runtime](../objects/inference/browser-inference-runtime.md)

## Produces

- A transient in-memory prediction result and, for V2 releases, a transient attention map.

## Does not produce

- Student submissions, AI feedback, grading, or persisted predictions.

## See

[Analyzer component](../../src/components/learning/learning-mode-analyzer.tsx)
