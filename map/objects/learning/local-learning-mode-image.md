---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Local Learning Mode image

A student-selected JPEG or PNG (a local file, or a case from the [Built-in X-ray library](built-in-xray-library.md)) held in browser memory for one transient analysis. It is validated for non-empty content and a maximum size of 6 MiB, previewed with a revocable object URL, and never uploaded or persisted.

## Connected to

Feeds [Learning Mode inference](../../processes/student-learning-mode-inference.md) and produces a [transient prediction result](../inference/prediction-result.md).

## If you change this

### Hits

- File validation, preview lifecycle, reset behavior, privacy copy, and client-side preprocessing.

### Does not hit

- Supabase Storage, database migrations, saved analyses, submissions, or activity feedback.

## See

[Learning Mode analyzer](../../../src/components/learning/learning-mode-analyzer.tsx)
