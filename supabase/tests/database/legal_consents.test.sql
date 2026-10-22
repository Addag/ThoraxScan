begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'legal_consents', 'legal consent table exists');
select has_column('public', 'legal_consents', 'user_id', 'consent owner exists');
select has_column('public', 'legal_consents', 'consent_type', 'consent type exists');
select has_column('public', 'legal_consents', 'document_version', 'document version exists');
select ok((select relrowsecurity from pg_class where oid = 'public.legal_consents'::regclass), 'RLS is enabled');
select ok(has_table_privilege('authenticated', 'public.legal_consents', 'select'), 'authenticated users can read their own consents');
select ok(not has_table_privilege('authenticated', 'public.legal_consents', 'insert'), 'direct consent inserts are denied');
select ok(not has_table_privilege('anon', 'public.legal_consents', 'select'), 'anonymous users cannot read consents');
select ok(has_function_privilege('authenticated', 'public.record_registration_consents(text)', 'execute'), 'authenticated registration consent RPC exists');
select ok(not has_function_privilege('anon', 'public.record_registration_consents(text)', 'execute'), 'anonymous registration consent RPC is denied');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = 'public.record_registration_consents(text)'::regprocedure), 'consent RPC is a restricted definer function');

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
values (
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'consent-student@example.test',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Consent Student","requested_role":"student"}',
  now(),
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);

select is(public.record_registration_consents('1.1'), 'recorded', 'the current policy version is recorded');
select is(public.record_registration_consents('1.1'), 'recorded', 'recording the same version again succeeds');
select is((select count(*) from public.legal_consents), 1::bigint, 'a repeated version adds no second record');
select is((select document_version from public.legal_consents), '1.1', 'the record keeps the accepted version');
select is(public.record_registration_consents('9.9'), 'invalid_version', 'an unknown policy version is rejected');

select * from finish();
rollback;
