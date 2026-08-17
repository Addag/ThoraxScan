# ThoraxScan

ThoraxScan is a Next.js and Supabase educational workspace prototype for chest X-ray learning.

## Getting started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Bootstrap the first administrator

Administrator is a separate capability, not a public registration role. After the first administrator has registered and confirmed their email, run this once in the linked development project's Supabase SQL Editor:

```sql
insert into public.platform_admins (user_id)
select auth_user.id
from auth.users as auth_user
where lower(auth_user.email) = lower('administrator@example.com')
  and auth_user.email_confirmed_at is not null
on conflict (user_id) do nothing;
```

Replace `administrator@example.com`, then verify the result:

```sql
select profile.display_name, auth_user.email, administrator.created_at
from public.platform_admins as administrator
join public.profiles as profile on profile.id = administrator.user_id
join auth.users as auth_user on auth_user.id = administrator.user_id;
```

The administrator then selects **Administrator** on the normal login page and is routed to `/admin`.

## Verification

```bash
npm run lint
npm run build
```
