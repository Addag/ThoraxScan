begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select ok(
  not has_function_privilege('anon', 'public.grant_platform_admin(text)', 'execute'),
  'anonymous users cannot grant administrator access'
);
select ok(
  not has_function_privilege('anon', 'public.revoke_platform_admin(uuid)', 'execute'),
  'anonymous users cannot revoke administrator access'
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
    '30000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin-first@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"First Admin","requested_role":"student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'admin-second@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Second Admin","requested_role":"student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'admin-unconfirmed@example.test',
    '',
    null,
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Unconfirmed","requested_role":"student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'admin-applicant@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Applicant","requested_role":"student"}',
    now(),
    now()
  );

insert into public.platform_admins (user_id)
values ('30000000-0000-0000-0000-000000000001');

insert into public.professor_applications (user_id, status, requested_at, reviewed_at, reviewed_by)
values (
  '30000000-0000-0000-0000-000000000004',
  'approved',
  now(),
  now(),
  '30000000-0000-0000-0000-000000000001'
);

set local role authenticated;

-- A non-administrator can do nothing.
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);
select is(public.grant_platform_admin('admin-second@example.test'), 'unauthorized', 'a non-administrator cannot grant');
select is(
  public.revoke_platform_admin('30000000-0000-0000-0000-000000000001'),
  'unauthorized',
  'a non-administrator cannot revoke'
);
select throws_ok('select * from public.list_platform_admins()', '42501', null, 'a non-administrator cannot list');

-- The first administrator grants and is refused for bad targets.
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select is(public.grant_platform_admin('nobody@example.test'), 'not_found', 'an unknown email is not found');
select is(
  public.grant_platform_admin('admin-unconfirmed@example.test'),
  'email_unconfirmed',
  'an unconfirmed account cannot become an administrator'
);
select is(public.grant_platform_admin(' Admin-Second@Example.test '), 'granted', 'email lookup ignores case and spaces');
select is(public.grant_platform_admin('admin-second@example.test'), 'already_admin', 'granting twice is reported');
select is(
  public.revoke_platform_admin('30000000-0000-0000-0000-000000000001'),
  'self',
  'an administrator cannot remove themselves'
);
select is(
  (select count(*)::int from public.list_platform_admins() where email like 'admin-%@example.test'),
  2,
  'both administrators are listed'
);
select is(
  (select created_by_name from public.list_platform_admins() where user_id = '30000000-0000-0000-0000-000000000002'),
  'First Admin',
  'the list shows who added an administrator'
);

-- The second administrator removes the first.
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);
select is(
  public.revoke_platform_admin('30000000-0000-0000-0000-000000000001'),
  'revoked',
  'an administrator can remove another'
);
select is(
  public.revoke_platform_admin('30000000-0000-0000-0000-000000000001'),
  'not_found',
  'removing a non-administrator is reported'
);

-- The removed administrator has lost access.
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select is(
  public.revoke_platform_admin('30000000-0000-0000-0000-000000000002'),
  'unauthorized',
  'a removed administrator cannot revoke'
);

reset role;

select is(
  (select reviewed_by from public.professor_applications where user_id = '30000000-0000-0000-0000-000000000004'),
  '30000000-0000-0000-0000-000000000001'::uuid,
  'past reviews keep the removed administrator'
);
select is(
  (select created_by from public.platform_admins where user_id = '30000000-0000-0000-0000-000000000002'),
  '30000000-0000-0000-0000-000000000001'::uuid,
  'past grants keep the removed administrator'
);

select * from finish();
rollback;
