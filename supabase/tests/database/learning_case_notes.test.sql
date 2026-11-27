begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_table('public','learning_case_notes','learning case notes table exists');
select col_is_pk('public','learning_case_notes',array['user_id','case_id'],'one note per user and case');
select ok((select relrowsecurity from pg_class where oid='public.learning_case_notes'::regclass), 'RLS enabled');
select ok(has_table_privilege('authenticated','public.learning_case_notes','select'), 'read grant');
select ok(has_table_privilege('authenticated','public.learning_case_notes','update'), 'update grant');
select ok(has_table_privilege('authenticated','public.learning_case_notes','delete'), 'delete grant');
select ok(not has_table_privilege('anon','public.learning_case_notes','select'), 'anonymous cannot read');
insert into auth.users(id, email, raw_user_meta_data) values ('51000000-0000-4000-8000-000000000001','notes-owner@example.test','{"display_name":"Notes fixture"}');
insert into auth.users(id, email, raw_user_meta_data) values ('51000000-0000-4000-8000-000000000002','notes-other@example.test','{"display_name":"Notes fixture"}');
select throws_ok($$insert into public.learning_case_notes(user_id,case_id,body) values ('51000000-0000-4000-8000-000000000001','cxp-001','')$$,'23514',null,'empty notes are rejected');
select throws_ok($$insert into public.learning_case_notes(user_id,case_id,body) values ('51000000-0000-4000-8000-000000000001','cxp-001',repeat('a',2001))$$,'23514',null,'over-length notes are rejected');
select throws_ok($$insert into public.learning_case_notes(user_id,case_id,body) values ('51000000-0000-4000-8000-000000000001','../CXP 1','Note')$$,'23514',null,'malformed case ids are rejected');

set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);
select lives_ok($$insert into public.learning_case_notes(user_id,case_id,body) values ('51000000-0000-4000-8000-000000000001','cxp-001','Opacity at the right base.')$$,'owner adds a note');
select lives_ok($$update public.learning_case_notes set body='Recheck the right base.' where case_id='cxp-001'$$,'owner edits a note');
select is((select body from public.learning_case_notes where case_id='cxp-001'),'Recheck the right base.','owner reads the edit');
select throws_ok($$insert into public.learning_case_notes(user_id,case_id,body) values ('51000000-0000-4000-8000-000000000002','cxp-002','Planted')$$,'42501',null,'cannot write notes for another user');

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.learning_case_notes),0::bigint,'others cannot see the note');
update public.learning_case_notes set body='Changed' where case_id='cxp-001';
delete from public.learning_case_notes where case_id='cxp-001';

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);
select is((select body from public.learning_case_notes where case_id='cxp-001'),'Recheck the right base.','others cannot change or delete the note');
select lives_ok($$delete from public.learning_case_notes where case_id='cxp-001'$$,'owner deletes a note');
select is((select count(*) from public.learning_case_notes),0::bigint,'note is gone');
reset role;

select * from finish();
rollback;
