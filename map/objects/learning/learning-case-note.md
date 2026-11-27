---
node_type: object
universe: live
status: verified
audited: 2026-10-30
snapshot: main @ 964382d
---

# Learning case note

A private self-review note a Student (or Professor) writes about a [built-in library](built-in-xray-library.md) case in Learning Mode. It is never submitted, graded, or shown to anyone else.

## Why this shape

Learning Mode has no case record, so the note is keyed by the library's stable `cases.json` id. Local uploads have no stable id and get no note. An empty note deletes the row instead of storing blank text.

## Shape

- `public.learning_case_notes(user_id → profiles, case_id text, body text 1–2000 chars, updated_at)`, primary key `(user_id, case_id)`, a `case_id` format check, and the shared `private.set_updated_at()` trigger, in [migration](<../../../supabase/migrations/20261030120000_learning_case_notes.sql>).
- RLS: authenticated users can select, insert, update, and delete only rows where `user_id = auth.uid()`; anon has no grants.
- [`saveLearningNoteAction`](<../../../src/app/(protected)/actions.ts>) checks the id against `cases.json`, trims and caps the body, then upserts or deletes.
- [`LearningModeContent`](<../../../src/components/learning/learning-mode-content.tsx>) loads the viewer's notes server-side; the [`LearningNotes`](<../../../src/components/learning/learning-notes.tsx>) panel shows under the analysis result.

## Connected to

[Built-in X-ray library](built-in-xray-library.md) supplies the case ids. Rendered by the [Learning Mode surface](../ui/student-learning-mode-surface.md).

## If you change this

### Hits

- Migration, RLS, and [pgTAP test](<../../../supabase/tests/database/learning_case_notes.test.sql>); the action and its [unit test](<../../../src/app/(protected)/actions.test.ts>); `MAX_LEARNING_NOTE_LENGTH` in [types](<../../../src/lib/learning-notes/types.ts>), which must match the SQL length check; the Learning Mode browser test.
- Renaming or renumbering `cases.json` ids orphans saved notes.

### Does not hit

- Activities, submissions, AI analysis, grading, analytics, or Professor views of Students.
