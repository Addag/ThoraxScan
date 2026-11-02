# ThoraxScan Supabase operations

## Accounts and roles

Registration creates a `student` profile unless the user picks Professor. A
Professor registration creates a `professor` profile plus a pending row in
`public.professor_applications`; the profile has no Professor access until an
administrator approves that application. The application has no public
role-elevation endpoint.

Approve or reject Professor applications from the **Professor applications**
section of `/admin`. Approval requires a confirmed email and no existing
workspace memberships. Do not promote Professors by updating `profiles.role`
directly: without an approved application, that account has no role at all.

Administrator is a separate `platform_admins` capability. See
[Bootstrap the first administrator](../README.md#bootstrap-the-first-administrator)
for the one-time SQL; after that, manage administrators from `/admin`. Never
expose a service-role or secret key in browser code.

## Local development

```bash
npx supabase start
```

```bash
npx supabase db reset
```

`db reset` applies every file in `migrations/`. Local Auth has CAPTCHA enabled in
`config.toml`, so the root `.env` must define `SUPABASE_AUTH_CAPTCHA_SECRET`
before `supabase start` (see the
[CAPTCHA section](../README.md#configure-captcha-protection)). Auth emails use
the HTML in `templates/`.

Run the pgTAP tests in `tests/database` against the local stack:

```bash
npx supabase test db
```

`snippets/` is ignored by git and holds personal SQL Editor queries.

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
