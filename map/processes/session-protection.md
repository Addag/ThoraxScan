---
node_type: process
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Session refresh and protected access

Request cookies → Supabase claim refresh and profile lookup → authenticated role surface or login redirect.

## Steps

1. The root proxy applies the session updater to non-static requests in [src/proxy.ts](<../../src/proxy.ts:5>).
2. The updater creates a cookie-aware server client, refreshes claims, and writes refreshed cookies in [proxy.ts](<../../src/lib/supabase/proxy.ts:4>).
3. The dashboard calls getCurrentProfile, redirects unauthenticated users to /login, and redirects valid profiles to their role route in [dashboard/page.tsx](<../../src/app/(protected)/dashboard/page.tsx:6>).
4. A role page calls requireRole and redirects users with a missing or mismatched profile back to /dashboard in [server.ts](<../../src/lib/auth/server.ts:33>).

## Consumes

- [Supabase auth boundary](../objects/runtime/supabase-auth-boundary.md)
- [Auth session and claims](../objects/identity/auth-session.md)
- [Profile](../objects/identity/profile.md)
- [AppRole](../objects/identity/app-role.md)

## Produces

- [Role workspace surface](../objects/learning/role-workspace-surface.md)
- A login redirect for unauthenticated or mismatched access

## If you change this

### Hits

- Cookie refresh, protected route behavior, profile loading, and role redirects.

### Does not hit

- Public page styling or model inference.
- Planned workspace-level authorization until those records exist.

## See

[server.ts](<../../src/lib/auth/server.ts:33>)
