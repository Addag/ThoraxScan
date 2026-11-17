---
node_type: process
universe: live
status: verified
audited: 2026-11-17
snapshot: main @ 6af6c16
---

# Activity authoring and publication

Approved Professor + teaching workspace → private draft and direct case upload → AI analysis of the draft → Professor-validated answer key → published or archived activity.

## Steps

1. The new-activity route rechecks the approved Professor role and loads only joined teaching workspaces before rendering the form in [new activity page](<../../src/app/(protected)/professor/activities/new/page.tsx:13>).
2. `createActivityDraftAction` validates text/due fields, re-derives claims, profile, approval, and membership, then creates the activity and private reference row (optional notes; the answer key is added in step 6) in [activity actions](<../../src/app/(protected)/professor/activities/actions.ts:189>).
3. `prepareCaseUploadAction` validates metadata/attestation, reserves a generated case/path, attaches it to the draft, and returns a non-upsert signed token in [upload preparation](<../../src/app/(protected)/professor/activities/actions.ts:272>).
4. The browser uploads the bytes directly (a local file or a [built-in library](../objects/learning/built-in-xray-library.md) case fetched into a `File`); `confirmCaseUploadAction` decodes the image, rejects confident lateral views with the [View detector](../objects/learning/view-detector.md), and calls a locked database confirmation that reads Storage metadata before changing the matching pending case to ready in [upload confirmation](<../../src/app/(protected)/professor/activities/actions.ts:367>).
5. Before publishing, `removeActivityCaseAction` can detach a draft's case and delete its object, with a retryable `cleanup_pending` state, in [case removal](<../../src/app/(protected)/professor/activities/actions.ts:433>). Update, publish, archive, and draft-delete actions re-derive authorization and invalidate role dashboards/routes in [lifecycle actions](<../../src/app/(protected)/professor/activities/actions.ts:432>).
6. Once the case is ready the [AI analysis](activity-ai-analysis.md) runs on the draft. The Professor validates it in [the answer key form](<../../src/components/professor/answer-key-form.tsx>): ticks the true labels (AI findings pre-ticked) and repaints the per-label heatmaps with the adjustable [heatmap brush](../objects/inference/attention-heatmap.md#painting-answer-key-and-student-answer) (size, strength, hardness, undo, Reset to AI). `saveAnswerKeyAction` calls `save_activity_answer_key`, which requires a draft with a ready analysis ([answer key migration](<../../supabase/migrations/20261116120000_professor_validated_answer_key.sql>)).
7. Database triggers and RLS independently enforce publication prerequisites (a ready case and a validated answer key), lifecycle transitions, private references, terminal archive, immutable published cases and answer keys, and that changing or deleting a draft's case drops its AI result and key, in [the activity migration](<../../supabase/migrations/20260820101401_activities_case_publication.sql:148>) and [the answer key migration](<../../supabase/migrations/20261116120000_professor_validated_answer_key.sql>).

## Consumes

- [Activity](../objects/learning/activity.md)
- [X-ray case](../objects/learning/xray-case.md)
- [Workspace](../objects/learning/workspace.md)
- [Professor application](../objects/identity/professor-application.md)

## Produces

- Draft, published, or archived [Activity](../objects/learning/activity.md)
- Pending, ready, or failed [X-ray case](../objects/learning/xray-case.md)

## If you change this

### Hits

- Professor activity forms/routes, direct Storage traffic, action states, case cleanup, dashboard revalidation, and database lifecycle/security enforcement.

### Does not hit

- Faculty grading, feedback release, or notifications. The answer key does hit Student results and grading: Students see it after submitting, and Professors grade against it.

## See

[activity actions](<../../src/app/(protected)/professor/activities/actions.ts:189>)
