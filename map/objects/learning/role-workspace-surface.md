---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Role workspace surface

The current student and professor routes are authenticated role surfaces that render a shared placeholder, not the planned LMS workspaces.

## Why this shape

The repository has role-gated entry points before the complete student/professor dashboards are implemented.

## Shape

- Student page requires student and renders RolePlaceholder in [student/page.tsx](<../../../src/app/(protected)/student/page.tsx:10>).
- Professor page requires professor and renders the same component in [professor/page.tsx](<../../../src/app/(protected)/professor/page.tsx:10>).
- The placeholder explicitly says the complete LMS dashboard is a future milestone in [role-placeholder.tsx](<../../../src/components/auth/role-placeholder.tsx:23>).

## Connected to

The [Profile](../identity/profile.md), [AppRole](../identity/app-role.md), /dashboard, and requireRole.

## If you change this

### Hits

- Protected route guards and role-specific page behavior.
- Shared role placeholder layout and logout surface.

### Does not hit

- The planned Workspace database record.
- Model inference, activities, submissions, or feedback, which have no current route implementation.

## Surfaces

Authenticated server-rendered pages and the current user.

## See

[role-placeholder.tsx](<../../../src/components/auth/role-placeholder.tsx:5>)
