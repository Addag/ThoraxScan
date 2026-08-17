---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 767ee8f + working tree
---

# Professor application

A Professor application is the approval lifecycle attached to a profile that selected Professor at registration.

## Why this shape

Professor identity can be created through public registration while teaching privileges remain locked until a separately authorized administrator records a review decision.

## Shape

- `user_id` is a profile-backed primary key; status is pending, approved, or rejected; rejection reasons are trimmed and limited to 500 characters; review-state constraints align status with audit fields in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:7>).
- Applicants can read only their own application through RLS in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:70>).
- Existing Professor profiles are backfilled as approved, while the replaced signup trigger creates new Professor applications with the default pending status in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:113>).
- `private.is_approved_professor` and the replaced workspace helpers require both the Professor profile role and approved status in [the approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:90>).

## Connected to

Connected to [Profile](profile.md), registration, login routing, the applicant status page, the [Administrator approval surface](../ui/administrator-approval-surface.md), and Professor workspace authorization. Status gates access but does not replace `Profile.role`.

## If you change this

### Hits

- Signup trigger metadata, profile access projection, route guards, workspace authorization helpers and validation, review RPC, and both approval/status interfaces.

### Does not hit

- Student access, password recovery, or inference/activity contracts.

## Surfaces

Supabase Postgres, registration and login actions, protected server components, administrator reviewers, and Professor applicants.

## See

[approval migration](<../../../supabase/migrations/20260817124643_professor_approval_administration.sql:7>)
