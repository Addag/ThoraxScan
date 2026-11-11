begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select ok(
  not has_function_privilege('anon', 'public.admin_delete_account(uuid)', 'execute'),
  'anonymous users cannot delete accounts'
);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'console-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Console Admin","requested_role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'console-student@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Console Student","requested_role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'console-professor@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Console Professor","requested_role":"professor"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'console-other@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Console Other","requested_role":"student"}', now(), now());

insert into public.platform_admins (user_id) values ('31000000-0000-0000-0000-000000000001');
update public.professor_applications set status = 'approved', reviewed_at = now()
where user_id = '31000000-0000-0000-0000-000000000003';
insert into public.workspaces (id, name, owner_id)
values ('31100000-0000-0000-0000-000000000001', 'Console workspace', '31000000-0000-0000-0000-000000000003');
insert into public.site_announcements (message, ends_at) values ('Expired notice', now() - interval '1 minute');

set local role authenticated;

-- A non-administrator can do nothing.
select set_config('request.jwt.claim.sub', '31000000-0000-0000-0000-000000000004', true);
select is(public.admin_delete_account('31000000-0000-0000-0000-000000000002'), 'unauthorized', 'a non-administrator cannot delete');
select is(public.admin_set_account_disabled('31000000-0000-0000-0000-000000000002', true), 'unauthorized', 'a non-administrator cannot disable');
select is(public.admin_rename_account('31000000-0000-0000-0000-000000000002', 'X'), 'unauthorized', 'a non-administrator cannot rename');
select is(public.post_site_announcement('Hi', 'info'), 'unauthorized', 'a non-administrator cannot post notices');
select throws_ok('select * from public.list_accounts()', '42501', null, 'a non-administrator cannot list accounts');
select throws_ok('select * from public.get_platform_stats()', '42501', null, 'a non-administrator cannot read stats');
select throws_ok('select * from public.list_admin_actions()', '42501', null, 'a non-administrator cannot read the log');

select set_config('request.jwt.claim.sub', '31000000-0000-0000-0000-000000000001', true);
select is(public.admin_delete_account('31000000-0000-0000-0000-000000000001'), 'self', 'an administrator cannot delete themselves');
select is(public.admin_set_account_disabled('31000000-0000-0000-0000-000000000001', true), 'self', 'an administrator cannot disable themselves');
select is(public.admin_rename_account('31000000-0000-0000-0000-000000000002', '   '), 'invalid_name', 'blank names are refused');
select is(public.admin_rename_account('31000000-0000-0000-0000-000000000002', ' Renamed Student '), 'renamed', 'an administrator can rename');
select is(public.admin_set_temporary_password('31000000-0000-0000-0000-000000000004', 'short1'), 'invalid_password', 'weak passwords are refused');
select is(public.admin_set_temporary_password('31000000-0000-0000-0000-000000000004', 'Temporary123'), 'password_set', 'an administrator can set a temporary password');
select is(public.admin_set_account_disabled('31000000-0000-0000-0000-000000000004', true), 'disabled', 'an administrator can disable');
select is(public.admin_delete_account('31000000-0000-0000-0000-000000000003'), 'has_records', 'a workspace owner cannot be deleted');
select is(public.admin_delete_account('31000000-0000-0000-0000-000000000002'), 'deleted', 'an account without records is deleted');
select is(public.post_site_announcement('  Maintenance tonight  ', 'warning'), 'posted', 'an administrator can post a notice');
select is(
  (select count(*)::int from public.list_admin_actions() where target_label like '%console-student@example.test%'),
  2,
  'rename and delete are logged with the deleted account''s name'
);

reset role;

select is(
  (select encrypted_password = extensions.crypt('Temporary123', encrypted_password) from auth.users where id = '31000000-0000-0000-0000-000000000004'),
  true,
  'the temporary password is stored as a bcrypt hash'
);
select ok(
  (select banned_until > now() + interval '50 years' from auth.users where id = '31000000-0000-0000-0000-000000000004'),
  'disable sets banned_until far ahead'
);
select is(
  (select count(*)::int from public.profiles where id = '31000000-0000-0000-0000-000000000002'),
  0,
  'the deleted profile cascades'
);

set local role anon;
select is(
  (select array_agg(message) from public.site_announcements),
  array['Maintenance tonight'],
  'anonymous visitors see only active notices'
);
reset role;

select set_config('request.jwt.claim.sub', '31000000-0000-0000-0000-000000000001', true);
select is(
  (select students from public.get_platform_stats()) >= 1,
  true,
  'stats count Students'
);

select * from finish();
rollback;
