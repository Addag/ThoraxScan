begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

select ok(
  has_function_privilege('authenticated', 'public.verify_own_password(text)', 'execute'),
  'authenticated users may verify their password'
);
select ok(
  not has_function_privilege('anon', 'public.verify_own_password(text)', 'execute'),
  'anonymous users cannot verify passwords'
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
    '20000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'password-owner@example.test',
    extensions.crypt('correct-horse', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Password Owner","requested_role":"student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'password-other@example.test',
    extensions.crypt('other-secret', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Password Other","requested_role":"student"}',
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

select ok(public.verify_own_password('correct-horse'), 'the right password verifies');
select ok(not public.verify_own_password('wrong-horse'), 'a wrong password does not verify');
select ok(
  not public.verify_own_password('other-secret'),
  'another account''s password does not verify for the caller'
);

select set_config('request.jwt.claim.sub', '', true);
select ok(
  not public.verify_own_password('correct-horse'),
  'a caller without a user claim never verifies'
);
reset role;

select * from finish();
rollback;
