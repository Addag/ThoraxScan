---
node_type: object
universe: live
status: verified
audited: 2026-11-18
snapshot: main @ 767ee8f + working tree
---

# Professor application

A Professor application is the approval lifecycle attached to a profile that selected Professor at registration.

## Why this shape

Professor identity can be created through public registration while teaching privileges remain locked until a separately authorized administrator records a review decision.

## Shape

- `user_id` is a profile-backed primary key; status is pending, approved, or rejected; rejection reasons are trimmed and limited to 500 characters; review-state constraints align status with audit fields in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:7>).
- Applicants can read only their own application through RLS in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:70>). The table is in the `supabase_realtime` publication ([realtime migration](<../../../supabase/migrations/20261118120000_professor_application_realtime.sql>)), and the same policy limits each applicant to their own row's changes, which refresh the pending status page live.
- A fresh approval or rejection emails the applicant through Resend ([email helper](<../../../src/lib/email/server.ts>)); see [the review process](../../processes/professor-application-review.md).
- Existing Professor profiles are backfilled as approved, while the replaced signup trigger creates new Professor applications with the default pending status in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:113>).
- `private.is_approved_professor` and the replaced workspace helpers require both the Professor profile role and approved status in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:90>).

## Connected to

Connected to [Profile](profile.md), registration, login routing, the applicant status page, the [Administrator approval surface](../ui/administrator-approval-surface.md), and Professor workspace authorization. Status gates access but does not replace `Profile.role`.

## If you change this

### Hits

- Signup trigger metadata, profile access projection, route guards, workspace authorization helpers and validation, review RPC, both approval/status interfaces, the review email, and the Realtime status listener.

### Does not hit

- Student access, password recovery, or inference/activity contracts.

## Surfaces

Supabase Postgres, registration and login actions, protected server components, administrator reviewers, and Professor applicants.

## See

[approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:7>)
