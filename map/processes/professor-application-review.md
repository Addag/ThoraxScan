---
node_type: process
universe: live
status: verified
audited: 2026-11-18
snapshot: main @ 767ee8f + working tree
---

# Review a Professor application

Professor registration → pending status → administrator review → approved workspace access or rejected status.

## Steps

1. Registration submits `requested_role`; the Auth trigger creates a Professor profile and pending application in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:128>).
2. Profile loading reads the caller's application status, and pending or rejected Professors are routed to `/professor/application` in [auth server guards](<../../src/lib/auth/server.ts:35>).
3. An administrator logs in with their own Student or Professor role and opens `/admin` from the Administration sidebar link; `requirePlatformAdmin` requires a `platform_admins` capability in [auth server guards](<../../src/lib/auth/server.ts>).
4. The administrator-only listing RPC returns application identity, email-confirmation state, and membership count in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:308>).
5. The review RPC re-checks capability and locks the application before approving or rejecting it; approval additionally requires confirmed email and no memberships in [the approval migration](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:363>).
6. The review action revalidates `/admin`, `/dashboard`, and `/professor/application` in [admin/actions.ts](<../../src/app/(protected)/admin/actions.ts:92>); approved Professors reach `/professor`, while rejected applicants see their status and optional reason in [application/page.tsx](<../../src/app/(protected)/professor/application/page.tsx:17>).
7. A fresh decision (`approved` or `rejected`, not `already_approved`) emails the applicant through Resend's HTTP API, with the rejection reason HTML-escaped, in [the email helper](<../../src/lib/email/server.ts>). It sends nothing without `RESEND_API_KEY` and `EMAIL_FROM`; a failed send never undoes the review, and the action appends "The email notification could not be sent." to its success message.
8. While the application is pending, the applicant's page mounts [ApplicationStatusListener](<../../src/components/professor/application-status-listener.tsx>). It subscribes to Realtime `UPDATE`s on their own `professor_applications` row ([realtime migration](<../../supabase/migrations/20261118120000_professor_application_realtime.sql>); RLS limits delivery to the applicant) and also refreshes on window focus. The refreshed server page redirects once approved.

## Consumes

- [Profile](../objects/identity/profile.md)
- [Professor application](../objects/identity/professor-application.md)
- [Platform administrator](../objects/identity/platform-administrator.md)

## Produces

- Approved Professor workspace access or a recorded rejected application.
- A review-result email to the applicant, when Resend is configured.
- [Administrator approval surface](../objects/ui/administrator-approval-surface.md)

## If you change this

### Hits

- Registration, login, application RLS, administrator authorization, review transitions, and Professor workspace guards.
- The review email (`RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL` for the login link) and its [test](<../../src/lib/email/server.test.ts>). Its HTML shell mirrors `supabase/templates/`, so keep the two in step.
- The Realtime publication: application RLS also decides which row changes reach the applicant's browser.

### Does not hit

- Student account provisioning or password-recovery movement.

## See

[review RPC](<../../supabase/migrations/20260817124643_professor_approval_administration.sql:363>)
