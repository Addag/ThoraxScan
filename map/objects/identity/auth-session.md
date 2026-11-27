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
- Optional two-step login (audited 2026-11-15) uses Supabase's TOTP factor: a session is `aal1` after the password and `aal2` after the code. [The migration](<../../../supabase/migrations/20261115120000_two_step_login.sql>) registers `public.require_two_step` as the PostgREST `db_pre_request` hook, so every table and RPC request from an `aal1` session of an account with a verified factor fails with `two_step_required`; a restrictive policy on `storage.objects` applies the same rule through `private.two_step_satisfied()`. Accounts without a verified factor are unaffected.

## Connected to

The [Profile](profile.md), auth processes, dashboard guard, role guard, and logout action.

## If you change this

### Hits

- Cookie behavior in browser and server clients.
- Proxy session refresh and protected-route access.
- Confirmation, reset-password, and logout behavior.
- The two-step rule: every Data API and Storage request, the `/login/verify` screen, and [its pgTAP test](<../../../supabase/tests/database/two_step_login.test.sql>).

### Does not hit

- Profile role values unless claims or profile lookup changes.
- Planned LMS records or model inference.

## Surfaces

Browser cookies, Next.js proxy, server components, server actions, and Supabase Auth.

## See

[supabase/server.ts](<../../../src/lib/supabase/server.ts:4>)
