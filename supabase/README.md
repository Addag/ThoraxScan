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
