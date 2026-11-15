begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select ok(
  has_function_privilege('anon', 'public.require_two_step()', 'execute'),
  'the pre-request check runs for anonymous requests too'
);
select ok(
  not has_function_privilege('anon', 'public.admin_reset_two_step(uuid)', 'execute'),
  'anonymous users cannot reset two-step login'
);
select is(
  (select array_to_string(rolconfig, ',') like '%pgrst.db_pre_request=public.require_two_step%' from pg_roles where rolname = 'authenticator'),
  true,
  'the Data API runs the check before every request'
);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'twostep-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Two Step Admin","requested_role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'twostep-on@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Two Step On","requested_role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'twostep-off@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Two Step Off","requested_role":"student"}', now(), now());

insert into public.platform_admins (user_id) values ('32000000-0000-0000-0000-000000000001');
insert into auth.mfa_factors (id, user_id, factor_type, status, secret, created_at, updated_at)
values
  ('32200000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'totp', 'verified', 'secret', now(), now()),
  -- An abandoned setup must not lock the account.
  ('32200000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000003', 'totp', 'unverified', 'secret', now(), now());

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000002","aal":"aal1"}', true);
select throws_ok('select public.require_two_step()', '42501', 'two_step_required', 'a password-only session is refused once two-step login is on');

select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000002","aal":"aal2"}', true);
select lives_ok('select public.require_two_step()', 'a session that passed the code step is allowed');

select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000003","aal":"aal1"}', true);
select lives_ok('select public.require_two_step()', 'an account without a verified factor is unchanged');

select set_config('request.jwt.claims', '', true);
select lives_ok('select public.require_two_step()', 'a request without a user is allowed');

select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000003","aal":"aal1"}', true);
select is(public.admin_reset_two_step('32000000-0000-0000-0000-000000000002'), 'unauthorized', 'a non-administrator cannot reset two-step login');

select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","aal":"aal1"}', true);
select is(public.admin_reset_two_step('32000000-0000-0000-0000-000000000001'), 'self', 'an administrator cannot reset their own');
select is(public.admin_reset_two_step('32000000-0000-0000-0000-000000000002'), 'two_step_reset', 'an administrator can reset two-step login');
select is(public.admin_reset_two_step('32000000-0000-0000-0000-000000000002'), 'no_two_step', 'a second reset finds nothing to remove');
select is(
  (select count(*)::int from public.list_admin_actions() where target_label like '%twostep-on@example.test%'),
  1,
  'the reset is logged once'
);

reset role;

select is(
  (select count(*)::int from auth.mfa_factors where user_id = '32000000-0000-0000-0000-000000000002'),
  0,
  'the factor is removed'
);

select * from finish();
rollback;
