---
node_type: process
universe: live
status: verified
audited: 2026-11-17
snapshot: main @ ed26b07 + working tree
---

# Student activity viewing

Joined Student → published activity query and short-lived private image URL → read-only assignment view.

## Steps

1. Student activity routes recheck the Student role before reading any assignment in [the activity list](<../../src/app/(protected)/student/activities/page.tsx:17>) and [detail route](<../../src/app/(protected)/student/activities/[activityId]/page.tsx:22>).
2. The server projection selects only published activity fields permitted by RLS and never queries or serializes the private reference evaluation in [Student projections](<../../src/lib/activities/server.ts:124>).
3. The detail projection derives the generated object path from student-readable workspace/case IDs and requests a ten-minute signed URL under the Storage read policy in [Student activity detail](<../../src/lib/activities/server.ts:157>).
4. The route renders instructions, due state, workspace context, and the private preview; the answer form (labels, optional written answer per label, a heatmap per finding) supports private drafts and final submission, and the results panel shows the validated answer key, the Student's labels and answers against it, and the Student's heatmap side by side with the validated one only after the server projection reports a finalized, released submission ([Student activity page](<../../src/app/(protected)/student/activities/[activityId]/page.tsx:22>)).
5. The detail route sends malformed IDs directly to the generic not-found path, while activity RLS makes draft, archived, other-workspace, and unknown rows unreadable before the same result in [the detail route](<../../src/app/(protected)/student/activities/[activityId]/page.tsx:31>) and [Student select policy](<../../supabase/migrations/20260820101401_activities_case_publication.sql:423>).

6. The page updates live while open: the Student shell mounts the bell's [NotificationListener](<../../src/components/notification-listener.tsx>), which calls `router.refresh()` on a `feedback_released` broadcast. Both a faculty evaluation release and an AI results release send it, so the faculty feedback panel and the Results panel re-render without a reload; the Results panel pops open when results arrive during the visit ([live results migration](<../../supabase/migrations/20261118140000_live_activity_results.sql>)).

## Consumes

- [Activity](../objects/learning/activity.md)
- [X-ray case](../objects/learning/xray-case.md)
- [Workspace membership](../objects/learning/workspace-membership.md)

## Produces

- Authorized read-only activity and short-lived case preview.

## If you change this

### Hits

- Student activity list/detail, recent dashboard cards, signed URL lifetime/error handling, and Student activity/storage RLS.
- The live refresh: the Student shell's bell listener and the two release broadcast triggers. A page outside the Student shell would lose it.

### Does not hit

- Professor reference evaluations, Professor draft authoring, or faculty evaluation. Released results (the Professor-validated key and its heatmap) are rendered by the activity detail view.

## See

[Student activity projections](<../../src/lib/activities/server.ts:124>)
