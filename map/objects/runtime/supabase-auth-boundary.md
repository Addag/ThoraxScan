---
node_type: object
universe: live
status: verified
audited: 2026-08-22
snapshot: main @ 59e6d7d + working tree
---

# Supabase auth boundary

The repository separates the public browser client from the cookie-backed server client and session-refresh proxy.

## Why this shape

Browser code needs the public Supabase configuration, while server components and actions need cookie-aware session access without placing service credentials in client code.

## Shape

- Browser client uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in [client.ts](<../../../src/lib/supabase/client.ts:3>).
- The shared auth form uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, while Supabase Auth verifies the resulting token with its server-only Turnstile secret in [auth-form.tsx](<../../../src/components/auth/auth-form.tsx:35>) and [config.toml](<../../../supabase/config.toml:214>).
- Server client reads cookies from Next headers in [server.ts](<../../../src/lib/supabase/server.ts:4>).
- Proxy refreshes claims and writes refreshed cookies in [proxy.ts](<../../../src/lib/supabase/proxy.ts:4>).
- The root proxy wrapper applies the matcher to non-static requests in [src/proxy.ts](<../../../src/proxy.ts:5>).

## Connected to

The [auth session](../identity/auth-session.md), auth actions, confirmation route, dashboard, and logout process.

## If you change this

### Hits

- Authenticated request behavior, cookie refresh, and protected pages.
- Supabase, Turnstile, environment configuration, and deployment setup.

### Does not hit

- Database table shape unless the client queries or permissions change.
- Future inference code, which is intended to run in the browser.

## Surfaces

Next.js browser client, server client, proxy, environment variables, and Supabase Auth.

## See

[proxy.ts](<../../../src/lib/supabase/proxy.ts:4>)
