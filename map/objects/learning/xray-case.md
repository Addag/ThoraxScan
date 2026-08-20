---
node_type: object
universe: live
status: verified
audited: 2026-08-20
snapshot: main @ ed26b07 + working tree
---

# X-ray case

X-ray case is the private `public.xray_cases` audit record paired with one object in the private `activity-cases` Supabase Storage bucket.

## Why this shape

Generated object paths and a separate audit row let the browser upload image bytes directly while the server verifies MIME, size, attestation, workspace, and immutable publication state.

## Shape

- Each case has a generated `{workspaceId}/{caseId}` path, frontal-view constraint, JPEG/PNG MIME, 1–6 MB size, `pending | ready | failed` upload state, uploader/attestation actors, and timestamps in [the case table](<../../../supabase/migrations/20260820101401_activities_case_publication.sql:1>).
- Case identity and ready metadata are immutable; any case attached to a published or archived activity rejects update/delete in [the case trigger](<../../../supabase/migrations/20260820101401_activities_case_publication.sql:102>).
- Storage read policy permits teaching staff and Students with a joined published activity, while upload/delete policies require a reserved or unpublished case in [storage policies](<../../../supabase/migrations/20260820101401_activities_case_publication.sql:521>).
- The Client Component uploads with the signed token and then invokes server confirmation without sending image bytes through the Server Action in [CaseUploadForm](<../../../src/components/professor/activity-forms.tsx:132>).
- Server confirmation downloads the reserved object and uses the runtime `sharp` dependency to reject undecodable or structurally unsupported files before database confirmation in [the confirmation action](<../../../src/app/(protected)/professor/activities/actions.ts:367>) and [package manifest](<../../../package.json:17>).

## Connected to

Belongs to a [Workspace](workspace.md), attaches to one [Activity](activity.md), and moves through [activity authoring and publication](../../processes/activity-authoring-publication.md).

## If you change this

### Hits

- Storage bucket constraints/policies, signed upload preparation, `sharp`-backed decode validation, metadata confirmation, signed read previews, draft replacement/deletion, and activity publication validation.

### Does not hit

- The static public X-ray sample, local model preprocessing, AI analysis, or attention heatmaps.

## Surfaces

Supabase Postgres and Storage, Professor upload/preview UI, and authorized Student signed previews.

## See

[case upload actions](<../../../src/app/(protected)/professor/activities/actions.ts:272>)
