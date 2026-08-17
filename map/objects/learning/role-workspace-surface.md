---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: working tree @ 2026-08-17
---

# Role workspace surfaces

The Student route is now a live workspace dashboard and read-only workspace detail surface; the Professor route still renders the shared placeholder.

## Why this shape

The student milestone exposes only membership redemption and joined-workspace reading while keeping activities and the professor application interface deferred.

## Shape

- Student page requires the Student role, reads joined workspaces, renders invitation redemption, and links to read-only details in [student/page.tsx](<../../../src/app/(protected)/student/page.tsx:13>).
- Student workspace detail re-checks the role and membership-derived workspace access in [workspaces/[workspaceId]/page.tsx](<../../../src/app/(protected)/student/workspaces/[workspaceId]/page.tsx:15>).
- Professor page still renders RolePlaceholder in [professor/page.tsx](<../../../src/app/(protected)/professor/page.tsx:10>).

## Connected to

The [Profile](../identity/profile.md), [AppRole](../identity/app-role.md), [Workspace](workspace.md), [Workspace membership](workspace-membership.md), [Invitation code](invitation-code.md), /dashboard, and requireRole.

## If you change this

### Hits

- Protected route guards, Student data projections/actions, the Student shell, and role-specific page behavior.
- Professor placeholder and the shared logout action.

### Does not hit

- Professor workspace management UI.
- Model inference, activities, submissions, or feedback, which have no current route implementation.

## Surfaces

Authenticated server-rendered pages and the current user.

## See

[student/page.tsx](<../../../src/app/(protected)/student/page.tsx:13>)
