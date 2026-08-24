# ThoraxScan Supabase operations

Public registration always creates a `student` profile. The application has no
public role-elevation endpoint.

To authorize a confirmed professor, a trusted database administrator can run:

```sql
update public.profiles
set role = 'professor', updated_at = now()
where id = (
  select id
  from auth.users
  where lower(email) = lower('professor@example.edu')
);
```

Verify that exactly one row was updated. Never expose this operation or a
service-role/secret key in browser code.

## Environments

Use the local Supabase stack for development, migration validation, and initial
model validation. The existing linked hosted project is the production project;
Vercel Production must point only to it. There is no preview or staging project
in the current topology, and each Supabase instance owns its independent seeded
`thoraxscan-classifier` slot.

Before applying a migration to production, run a linked dry run, review the
Supabase Security and Performance Advisors, and take a current database backup.
Publisher service-role credentials belong only in the operator environment, not
in Vercel or browser-exposed variables.
