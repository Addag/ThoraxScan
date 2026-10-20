begin;

create extension if not exists pgtap with schema extensions;
select plan(33);

select has_table('public', 'account_settings', 'account settings table exists');
select has_column('public', 'account_settings', 'profile_id', 'profile id exists');
select has_column('public', 'account_settings', 'work_phone', 'work phone exists');
select has_column('public', 'account_settings', 'created_at', 'created timestamp exists');
select has_column('public', 'account_settings', 'updated_at', 'updated timestamp exists');
select col_is_pk(
  'public',
  'account_settings',
  'profile_id',
  'one settings row is keyed to each profile'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.account_settings'::regclass),
  'row level security is enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.account_settings', 'select'),
  'authenticated users may select settings'
);
select ok(
  not has_table_privilege('authenticated', 'public.account_settings', 'insert'),
  'authenticated users cannot directly insert settings'
);
select ok(
  not has_table_privilege('authenticated', 'public.account_settings', 'update'),
  'authenticated users cannot directly update settings'
);
select ok(
  not has_table_privilege('authenticated', 'public.account_settings', 'delete'),
  'authenticated users cannot directly delete settings'
);
select ok(
  not has_table_privilege('anon', 'public.account_settings', 'select'),
  'anonymous users cannot read settings'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.update_own_account_settings(text,text)',
    'execute'
  ),
  'authenticated users may execute the settings RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_own_account_settings(text,text)',
    'execute'
  ),
  'anonymous users cannot execute the settings RPC'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'settings-student@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Settings Student","requested_role":"student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'settings-professor@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Settings Professor","requested_role":"professor"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'settings-other@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Settings Other","requested_role":"student"}',
    now(),
    now()
  );

insert into public.account_settings (profile_id)
values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003');

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select is(
  (select count(*) from public.account_settings),
  1::bigint,
  'a Student reads only their own settings row'
);
select throws_ok(
  $$insert into public.account_settings (profile_id) values ('10000000-0000-0000-0000-000000000002')$$,
  '42501',
  'permission denied for table account_settings',
  'direct settings inserts are denied'
);
select throws_ok(
  $$update public.account_settings set work_phone = null$$,
  '42501',
  'permission denied for table account_settings',
  'direct settings updates are denied'
);
select throws_ok(
  $$delete from public.account_settings where profile_id = '10000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table account_settings',
  'direct settings deletes are denied'
);
select throws_ok(
  $$select public.update_own_account_settings('Changed Student', '+63 917 555 0101')$$,
  '22023',
  'work phone is available only to professor accounts',
  'Student accounts cannot save a work phone'
);

reset role;
select is(
  (
    select display_name
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  'Settings Student',
  'a rejected RPC leaves the profile update rolled back'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
select throws_ok(
  $$select public.update_own_account_settings('   ', null)$$,
  '22023',
  'display name must contain between 1 and 100 characters',
  'blank display names are rejected'
);
select throws_ok(
  $$select public.update_own_account_settings('Settings Student', 'CALL-NOW')$$,
  '22023',
  'work phone must contain 7 to 32 phone-like characters',
  'unsupported phone characters are rejected'
);
select lives_ok(
  $$select public.update_own_account_settings('  Updated Student  ', null)$$,
  'a Student can update their supported settings'
);

reset role;
select is(
  (
    select display_name
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  'Updated Student',
  'the RPC trims and saves the display name'
);
select ok(
  (
    select work_phone is null
    from public.account_settings
    where profile_id = '10000000-0000-0000-0000-000000000001'
  ),
  'the RPC upserts the Student settings row'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);
select lives_ok(
  $$select public.update_own_account_settings('  Updated Professor  ', ' +63 2 8123 4567 ')$$,
  'a Professor can save a work phone'
);
select is(
  (select count(*) from public.account_settings),
  1::bigint,
  'a Professor reads only their own settings row'
);

reset role;
select is(
  (
    select display_name
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000002'
  ),
  'Updated Professor',
  'the Professor display name is normalized'
);
select is(
  (
    select work_phone
    from public.account_settings
    where profile_id = '10000000-0000-0000-0000-000000000002'
  ),
  '+63 2 8123 4567',
  'the Professor work phone is normalized and saved'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);
select lives_ok(
  $$select public.update_own_account_settings('Updated Professor', '   ')$$,
  'the RPC updates an existing settings row'
);

reset role;
select ok(
  (
    select work_phone is null
    from public.account_settings
    where profile_id = '10000000-0000-0000-0000-000000000002'
  ),
  'blank phone values become null'
);
select is(
  (
    select count(*)
    from public.account_settings
    where profile_id = '10000000-0000-0000-0000-000000000002'
  ),
  1::bigint,
  'settings updates keep one row per profile'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$select public.update_own_account_settings('Anonymous', null)$$,
  '42501',
  'authentication required',
  'an authenticated database role without a user claim is denied'
);
reset role;

select * from finish();
rollback;
