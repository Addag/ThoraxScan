---
node_type: object
universe: live
status: verified
audited: 2026-10-03
snapshot: Convert_to_Tailwind @ 0958975
---

# Administrator approval surface

The `/admin` dashboard is a role-independent, capability-protected surface for reviewing Professor applications.

## Why this shape

The page reuses the established dashboard visual system while keeping review data and mutations behind independent server and database authorization checks.

## Shape

- The page calls `requirePlatformAdmin` before loading the administrator-only application projection in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:35>).
- Counts, status filters, and name/email filtering are derived from the returned projection in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:39>).
- The review Server Action validates form fields, re-derives the caller capability, invokes the RPC, and revalidates affected routes in [admin/actions.ts](<../../../src/app/(protected)/admin/actions.ts:22>).
- Administrator-specific responsive rules are owned by [globals.css](<../../../src/app/globals.css:3270>); the status badge carries its own Tailwind utilities in [admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:18>), and the sidebar comes from the shared [AppShell](<../../../src/components/app-shell.tsx>).

## Connected to

Connected to the [Platform administrator](../identity/platform-administrator.md), [Professor application](../identity/professor-application.md), [authentication surface](auth-surface.md), and [review process](../../processes/professor-application-review.md).

## If you change this

### Hits

- Administrator page/components, review form state, admin-specific CSS, application projection, and review action messages.

### Does not hit

- Student dashboard behavior or approved Professor workspace presentation.

## Surfaces

Authenticated administrator browser UI, server-rendered page, Server Action, and responsive visual QA.

## See

[admin/page.tsx](<../../../src/app/(protected)/admin/page.tsx:35>)
