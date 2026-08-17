---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Role workspace surfaces

The Student and Professor routes are live role-gated workspace dashboards with role-specific detail and mutation surfaces.

## Why this shape

The workspace milestone exposes membership and invitation workflows while keeping activities, cases, inference, submissions, and analytics deferred.

## Shape

- Student page requires the Student role, reads joined workspaces, renders invitation redemption, and links to read-only details in [student/page.tsx](<../../../src/app/(protected)/student/page.tsx:13>).
- Student workspace detail re-checks the role and membership-derived workspace access in [workspaces/[workspaceId]/page.tsx](<../../../src/app/(protected)/student/workspaces/[workspaceId]/page.tsx:15>).
- Professor page reads owned/joined workspaces and renders creation and Professor-code redemption in [professor/page.tsx](<../../../src/app/(protected)/professor/page.tsx:16>).
- Professor workspace detail derives owner/co-professor capabilities and renders roster, invitation, rename, removal, and exit controls in [workspaces/[workspaceId]/page.tsx](<../../../src/app/(protected)/professor/workspaces/[workspaceId]/page.tsx:67>).

## Connected to

The [Profile](../identity/profile.md), [AppRole](../identity/app-role.md), [Workspace](workspace.md), [Workspace membership](workspace-membership.md), [Invitation code](invitation-code.md), /dashboard, and requireRole.

## If you change this

### Hits

- Protected route guards, Student and Professor data projections/actions, both responsive shells, and role-specific page behavior.
- Shared logout action and workspace form-state contracts.

### Does not hit

- Model inference, activities, submissions, or feedback, which have no current route implementation.

## Surfaces

Authenticated server-rendered pages and the current user.

## See

[professor/page.tsx](<../../../src/app/(protected)/professor/page.tsx:16>)
