---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Auth session and claims

The live session boundary is a Supabase Auth session carried through server/browser cookies and checked through claims.

## Why this shape

The app needs one consistent boundary for registration, confirmation, login, recovery, protected pages, and logout without exposing server-only credentials.

## Shape

- Browser client uses public Supabase URL and publishable key in [client.ts](<../../../src/lib/supabase/client.ts:1>).
- Server client reads and writes request cookies in [server.ts](<../../../src/lib/supabase/server.ts:4>).
- Proxy refreshes the session by calling getClaims() in [proxy.ts](<../../../src/lib/supabase/proxy.ts:4>).
- Confirmation accepts a token hash or code and redirects only to a safe relative destination in [confirm route](<../../../src/app/auth/confirm/route.ts:14>).

## Connected to

The [Profile](profile.md), auth processes, dashboard guard, role guard, and logout action.

## If you change this

### Hits

- Cookie behavior in browser and server clients.
- Proxy session refresh and protected-route access.
- Confirmation, reset-password, and logout behavior.

### Does not hit

- Profile role values unless claims or profile lookup changes.
- Planned LMS records or model inference.

## Surfaces

Browser cookies, Next.js proxy, server components, server actions, and Supabase Auth.

## See

[supabase/server.ts](<../../../src/lib/supabase/server.ts:4>)
