begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'legal_consents', 'legal consent table exists');
select has_column('public', 'legal_consents', 'user_id', 'consent owner exists');
select has_column('public', 'legal_consents', 'consent_type', 'consent type exists');
select has_column('public', 'legal_consents', 'document_version', 'document version exists');
select has_column('public', 'legal_consents', 'age_band', 'age band exists');
select ok((select relrowsecurity from pg_class where oid = 'public.legal_consents'::regclass), 'RLS is enabled');
select ok(has_table_privilege('authenticated', 'public.legal_consents', 'select'), 'authenticated users can read their own consents');
select ok(not has_table_privilege('authenticated', 'public.legal_consents', 'insert'), 'direct consent inserts are denied');
select ok(not has_table_privilege('anon', 'public.legal_consents', 'select'), 'anonymous users cannot read consents');
select ok(has_function_privilege('authenticated', 'public.record_registration_consents(text,boolean)', 'execute'), 'authenticated registration consent RPC exists');
select ok(not has_function_privilege('anon', 'public.record_registration_consents(text,boolean)', 'execute'), 'anonymous registration consent RPC is denied');
select ok(has_function_privilege('authenticated', 'public.withdraw_research_consent()', 'execute'), 'authenticated withdrawal RPC exists');
select ok(not has_function_privilege('anon', 'public.withdraw_research_consent()', 'execute'), 'anonymous withdrawal RPC is denied');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = 'public.record_registration_consents(text,boolean)'::regprocedure), 'consent RPC is a restricted definer function');

select * from finish();
rollback;
