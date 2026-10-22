begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_table('public','notification_reads','notification reads table exists');
select col_is_pk('public','notification_reads',array['user_id','kind','ref_id'],'one read per user and notification');
select ok((select relrowsecurity from pg_class where oid='public.notification_reads'::regclass), 'RLS enabled');
select ok(has_table_privilege('authenticated','public.notification_reads','select'), 'read grant');
select ok(has_table_privilege('authenticated','public.notification_reads','insert'), 'insert grant');
select ok(not has_table_privilege('authenticated','public.notification_reads','update'), 'no direct update');
select ok(not has_table_privilege('authenticated','public.notification_reads','delete'), 'no direct delete');
select ok(not has_table_privilege('anon','public.notification_reads','select'), 'anonymous cannot read');
insert into auth.users(id, email, raw_user_meta_data) values ('41000000-0000-4000-8000-000000000001','notify-student@example.test','{"display_name":"Notify fixture"}');
insert into auth.users(id, email, raw_user_meta_data) values ('41000000-0000-4000-8000-000000000002','notify-outsider@example.test','{"display_name":"Notify fixture"}');
insert into auth.users(id, email, raw_user_meta_data) values ('41000000-0000-4000-8000-000000000003','notify-professor@example.test','{"display_name":"Notify fixture"}');
update public.profiles set role='professor' where id='41000000-0000-4000-8000-000000000003';
insert into public.professor_applications(user_id,status,reviewed_at) values ('41000000-0000-4000-8000-000000000003','approved',now()) on conflict(user_id) do update set status='approved',reviewed_at=now();
insert into public.workspaces(id,name,owner_id) values ('43000000-0000-4000-8000-000000000001','Notification testing','41000000-0000-4000-8000-000000000003');
insert into public.workspace_members(workspace_id,user_id,role) values ('43000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','student');
insert into public.xray_cases(id,workspace_id,storage_path,uploaded_by,mime_type,byte_size,upload_status,attested_by) values ('44000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001/44000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000003','image/png',100,'ready','41000000-0000-4000-8000-000000000003');
insert into public.activities(id,workspace_id,case_id,created_by,title,instructions,due_at) values ('42000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000003','Notify activity','Review this chest X-ray.',now()+interval '3 days');
insert into public.activity_reference_evaluations(activity_id,evaluation) values ('42000000-0000-4000-8000-000000000001','Reference');
update public.activities set status='published' where id='42000000-0000-4000-8000-000000000001';
select throws_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000001','bogus','42000000-0000-4000-8000-000000000001')$$,'23514',null,'unknown kinds are rejected');

set local role authenticated;
select set_config('request.jwt.claim.sub','41000000-0000-4000-8000-000000000001',true);
select is(public.save_student_activity_submission('42000000-0000-4000-8000-000000000001','Final','normal','',true), 'submitted', 'fixture submission');
select lives_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000001','activity_due','42000000-0000-4000-8000-000000000001')$$,'member marks a visible due read');
select lives_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000001','activity_due','42000000-0000-4000-8000-000000000001') on conflict do nothing$$,'marking read again is a no-op');
select is((select count(*) from public.notification_reads),1::bigint,'member sees one own read');
select throws_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000003','activity_due','42000000-0000-4000-8000-000000000001')$$,'42501',null,'cannot write reads for another user');
select throws_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000001','submission','42000000-0000-4000-8000-000000000001')$$,'42501',null,'kind must match the referenced row');

select set_config('request.jwt.claim.sub','41000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.notification_reads),0::bigint,'outsider cannot see other reads');
select throws_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000002','activity_due','42000000-0000-4000-8000-000000000001')$$,'42501',null,'outsider cannot mark an invisible activity');

select set_config('request.jwt.claim.sub','41000000-0000-4000-8000-000000000003',true);
select lives_ok($$insert into public.notification_reads(user_id,kind,ref_id) select '41000000-0000-4000-8000-000000000003','submission',id from public.student_submissions$$,'professor marks a final submission read');
select lives_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000003','activity_due','42000000-0000-4000-8000-000000000001')$$,'professor marks a workspace due read');
select is((select count(*) from public.notification_reads),2::bigint,'professor sees only own reads');
select throws_ok($$insert into public.notification_reads(user_id,kind,ref_id) values ('41000000-0000-4000-8000-000000000003','submission','49000000-0000-4000-8000-000000000001')$$,'42501',null,'unknown submissions cannot be marked');
reset role;

select * from finish();
rollback;
