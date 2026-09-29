---
node_type: process
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Activity authoring and publication

Approved Professor + teaching workspace → private draft and direct case upload → published or archived activity.

## Steps

1. The new-activity route rechecks the approved Professor role and loads only joined teaching workspaces before rendering the form in [new activity page](<../../src/app/(protected)/professor/activities/new/page.tsx:13>).
2. `createActivityDraftAction` validates text/due fields, re-derives claims, profile, approval, and membership, then creates the activity and private reference row in [activity actions](<../../src/app/(protected)/professor/activities/actions.ts:189>).
3. `prepareCaseUploadAction` validates metadata/attestation, reserves a generated case/path, attaches it to the draft, and returns a non-upsert signed token in [upload preparation](<../../src/app/(protected)/professor/activities/actions.ts:272>).
4. The browser uploads the bytes directly (a local file or a [built-in library](../objects/learning/built-in-xray-library.md) case fetched into a `File`); `confirmCaseUploadAction` decodes the image and calls a locked database confirmation that reads Storage metadata before changing the matching pending case to ready in [upload confirmation](<../../src/app/(protected)/professor/activities/actions.ts:367>).
5. Update, publish, archive, and draft-delete actions re-derive authorization and invalidate role dashboards/routes in [lifecycle actions](<../../src/app/(protected)/professor/activities/actions.ts:432>).
6. Database triggers and RLS independently enforce publication prerequisites, lifecycle transitions, private references, terminal archive, and immutable published cases in [the activity migration](<../../supabase/migrations/20260820101401_activities_case_publication.sql:148>).

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

- Student response submission, AI inference, grading, feedback release, or notifications.

## See

[activity actions](<../../src/app/(protected)/professor/activities/actions.ts:189>)
