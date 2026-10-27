---
node_type: process
universe: live
status: verified
audited: 2026-10-27
snapshot: main @ 76f6977 + working tree
---

# Confirmation and password recovery

Email link or OTP/code → Supabase confirmation or recovery session → verified destination or password update.

## Steps

1. Forgot-password requires a Cloudflare Turnstile token, validates the email, and requests a reset link with a destination of /auth/confirm?next=/reset-password in [actions.ts](<../../src/app/(auth)/actions.ts:212>).
2. The confirmation route accepts a token hash and OTP type or a code, then verifies it with Supabase Auth in [route.ts](<../../src/app/auth/confirm/route.ts:21>).
3. The route allows only safe relative next destinations and sends failures to /login in [route.ts](<../../src/app/auth/confirm/route.ts:14>).
4. The reset page checks for valid claims and redirects unauthenticated users back to forgot-password in [page.tsx](<../../src/app/(auth)/reset-password/page.tsx:12>).
5. The reset action itself does not require CAPTCHA; it validates the new password with the same rule as registration (at least 8 characters with at least one letter and one number (`validatePassword` in [actions.ts](<../../src/app/(auth)/actions.ts:36>)); Supabase's `weak_password` error maps to the same message ([actions.ts](<../../src/app/(auth)/actions.ts:61>))), updates the recovered Auth user, globally signs out, and redirects to login in [actions.ts](<../../src/app/(auth)/actions.ts:253>).

Supabase sends the confirmation and recovery emails from the branded templates `confirmation.html` and `recovery.html` in [supabase/templates](<../../supabase/templates/confirmation.html>), wired in [config.toml](<../../supabase/config.toml:246>).

## Consumes

- [Authentication surface](../objects/ui/auth-surface.md)
- [Auth session and claims](../objects/identity/auth-session.md)

## Produces

- A confirmed or recovered Auth session
- A password-updated sign-in state

## If you change this

### Hits

- CAPTCHA-protected recovery requests, reset destinations, confirmation handling, safe redirect rules, password validation, login messaging, and the confirmation/recovery email templates.

### Does not hit

- Profile role values or planned LMS records.
- The public landing layout unless the recovery links change.

## See

[route.ts](<../../src/app/auth/confirm/route.ts:21>)
