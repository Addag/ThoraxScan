---
node_type: object
universe: live
status: verified
audited: 2026-08-30
snapshot: main @ 7aed17a + working tree
---

# Role workspace surfaces

The Student and approved-Professor routes are live role-gated workspace and activity dashboards with role-specific detail and mutation surfaces.

## Why this shape

The role surfaces share one responsive shell while keeping Professor activity authoring/reference data separate from Student published-only reading.

## Shape

- Student page requires the Student role, reads joined workspaces, renders invitation redemption, and links to read-only details in [student/page.tsx](<../../../src/app/(protected)/student/page.tsx:15>).
- Student workspace detail re-checks the role and membership-derived workspace access in [workspaces/[workspaceId]/page.tsx](<../../../src/app/(protected)/student/workspaces/[workspaceId]/page.tsx:15>).
- Professor page reads owned/joined workspaces and renders creation and Professor-code redemption in [professor/page.tsx](<../../../src/app/(protected)/professor/page.tsx:17>).
- `requireRole("professor")` redirects pending or rejected Professors to their application page in [auth server guards](<../../../src/lib/auth/server.ts:65>).
- Professor workspace detail derives owner/co-professor capabilities and renders roster, invitation, rename, removal, and exit controls in [workspaces/[workspaceId]/page.tsx](<../../../src/app/(protected)/professor/workspaces/[workspaceId]/page.tsx:67>).
- Professor activity routes expose filtered lifecycle lists, draft authoring, direct case upload, publishing, and archive controls in [activities/page.tsx](<../../../src/app/(protected)/professor/activities/page.tsx:21>).
- Student activity routes list joined published assignments and render read-only instructions/private previews without reference answers in [student activities](<../../../src/app/(protected)/student/activities/page.tsx:17>).
- Both responsive shells link to one role-aware [Shared settings surface](../ui/shared-settings-surface.md), with active navigation state and the existing truthful future-feature/model labels preserved.

## Connected to

The [Profile](../identity/profile.md), [Account settings](../runtime/account-settings.md), [Shared settings surface](../ui/shared-settings-surface.md), [Professor application](../identity/professor-application.md), [AppRole](../identity/app-role.md), [Workspace](workspace.md), [Workspace membership](workspace-membership.md), [Invitation code](invitation-code.md), [Activity](activity.md), [X-ray case](xray-case.md), `/dashboard`, and `requireRole`.

## If you change this

### Hits

- Protected route guards, Professor approval routing, Student and Professor workspace/activity/settings projections/actions, both responsive shells, and role-specific page behavior.
- Shared logout action and workspace form-state contracts.

### Does not hit

- Administrator review UI, model inference, submissions, grading, AI feedback, or analytics.

## Surfaces

Authenticated server-rendered pages and the current user.

## See

[professor/page.tsx](<../../../src/app/(protected)/professor/page.tsx:17>)
