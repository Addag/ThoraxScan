---
node_type: process
universe: live
status: verified
audited: 2026-09-17
snapshot: working tree
---

# Student Learning Mode inference

1. The Student-only route is protected with `requireRole("student")`.
2. The analyzer validates a selected JPEG or PNG, previews it locally, and retains it only in browser memory.
3. Analyze dynamically loads the inference runtime, resolves the active release through Supabase, verifies the model artifact, preprocesses the image, and runs WASM with one thread.
4. The client renders thresholded findings, all manifest labels, suppression state, provenance, and a non-diagnostic disclaimer.
5. Reset aborts the active run and invalidates stale completions; no database, Storage, submission, or saved-analysis write occurs.

## Consumes

- [Student Learning Mode surface](../objects/ui/student-learning-mode-surface.md)
- [Local Learning Mode image](../objects/learning/local-learning-mode-image.md)
- [Browser inference runtime](../objects/inference/browser-inference-runtime.md)

## Produces

- A transient in-memory prediction result.

## Does not produce

- Student submissions, AI feedback, grading, heatmaps, or persisted records.

## See

[Analyzer component](../../src/components/student/learning-mode-analyzer.tsx)
