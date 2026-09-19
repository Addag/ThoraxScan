---
node_type: process
universe: live
status: verified
audited: 2026-08-20
snapshot: main @ ed26b07 + working tree
---

# Student activity viewing

Joined Student → published activity query and short-lived private image URL → read-only assignment view.

## Steps

1. Student activity routes recheck the Student role before reading any assignment in [the activity list](<../../src/app/(protected)/student/activities/page.tsx:17>) and [detail route](<../../src/app/(protected)/student/activities/[activityId]/page.tsx:22>).
2. The server projection selects only published activity fields permitted by RLS and never queries or serializes the private reference evaluation in [Student projections](<../../src/lib/activities/server.ts:124>).
3. The detail projection derives the generated object path from student-readable workspace/case IDs and requests a ten-minute signed URL under the Storage read policy in [Student activity detail](<../../src/lib/activities/server.ts:157>).
4. The route renders instructions, due state, workspace context, and the private preview; the response form supports private drafts and final submission, while AI remains disabled in [Student activity page](<../../src/app/(protected)/student/activities/[activityId]/page.tsx:22>).
5. The detail route sends malformed IDs directly to the generic not-found path, while activity RLS makes draft, archived, other-workspace, and unknown rows unreadable before the same result in [the detail route](<../../src/app/(protected)/student/activities/[activityId]/page.tsx:31>) and [Student select policy](<../../supabase/migrations/20260820101401_activities_case_publication.sql:423>).

## Consumes

- [Activity](../objects/learning/activity.md)
- [X-ray case](../objects/learning/xray-case.md)
- [Workspace membership](../objects/learning/workspace-membership.md)

## Produces

- Authorized read-only activity and short-lived case preview.

## If you change this

### Hits

- Student activity list/detail, recent dashboard cards, signed URL lifetime/error handling, and Student activity/storage RLS.

### Does not hit

- Professor reference evaluations, Professor draft authoring or AI processing.

## See

[Student activity projections](<../../src/lib/activities/server.ts:124>)
