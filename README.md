# ThoraxScan

ThoraxScan is a Next.js and Supabase educational workspace prototype for chest X-ray learning.

## Getting started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configure CAPTCHA protection

ThoraxScan uses Cloudflare Turnstile with Supabase Auth for registration,
password login, and password-recovery requests.

1. Create a managed Turnstile widget in Cloudflare. Restrict the production
   widget to the deployed ThoraxScan hostname; do not allow `localhost` on the
   production widget.
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the application hosting environment.
   This site key is public and is rendered in the browser.
3. In Supabase, open **Authentication > Bot and Abuse Protection**, select
   Turnstile, enter the widget secret, and enable CAPTCHA protection. Store the
   secret only in Supabase; never expose it through a `NEXT_PUBLIC_` variable.

For local browser checks, Cloudflare provides an always-pass test site key:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

When running the local Supabase stack, pair it with Cloudflare's matching test
secret in the uncommitted root `.env` file:

```dotenv
SUPABASE_AUTH_CAPTCHA_SECRET=1x0000000000000000000000000000000AA
```

Do not use either test key in production. Deploy the CAPTCHA-aware application
before enabling CAPTCHA in hosted Supabase; otherwise signup, login, and
password recovery will reject requests without a token. If rollback is needed,
disable CAPTCHA in Supabase before rolling back the application.

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
