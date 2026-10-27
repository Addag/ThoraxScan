begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_function('public','get_professor_workspace_ai_calls',array['uuid'],'AI calls function exists');
select ok(not has_function_privilege('anon','public.get_professor_workspace_ai_calls(uuid)','execute'), 'anonymous cannot execute');
select ok(has_function_privilege('authenticated','public.get_professor_workspace_ai_calls(uuid)','execute'), 'authenticated can execute');

-- 1 owns workspace A, 2 owns workspace B, 3 is a Student in A.
insert into auth.users(id, email, raw_user_meta_data) values
  ('51000000-0000-4000-8000-000000000001','calls-prof-a@example.test','{"display_name":"Calls fixture"}'),
  ('51000000-0000-4000-8000-000000000002','calls-prof-b@example.test','{"display_name":"Calls fixture"}'),
  ('51000000-0000-4000-8000-000000000003','calls-student@example.test','{"display_name":"Calls fixture"}');
update public.profiles set role='professor' where id in ('51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000002');
insert into public.professor_applications(user_id,status,reviewed_at)
  select id,'approved',now() from public.profiles where id in ('51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000002')
  on conflict(user_id) do update set status='approved',reviewed_at=now();
insert into public.workspaces(id,name,owner_id) values
  ('53000000-0000-4000-8000-00000000000a','Calls A','51000000-0000-4000-8000-000000000001'),
  ('53000000-0000-4000-8000-00000000000b','Calls B','51000000-0000-4000-8000-000000000002');
insert into public.workspace_members(workspace_id,user_id,role) values ('53000000-0000-4000-8000-00000000000a','51000000-0000-4000-8000-000000000003','student');

-- Published activities and analyses are fixture state, not the workflow under test, so skip lifecycle triggers and FKs to model releases.
set local session_replication_role = replica;
create temp table call_fixtures(n int, workspace char(1), status text, findings jsonb);
insert into call_fixtures values
  (1,'a','ready','[{"label":"No Finding","probability":0.6,"threshold":0.5},{"label":"Edema","probability":0.7,"threshold":0.5}]'),
  (2,'a','ready','[{"label":"No Finding","probability":0.9,"threshold":0.5}]'),
  (3,'a','ready','[]'),
  (4,'a','pending',null),
  (5,'b','ready','[{"label":"Edema","probability":0.7,"threshold":0.5}]');
insert into public.xray_cases(id,workspace_id,storage_path,uploaded_by,attested_by,mime_type,byte_size,upload_status)
  select ('54000000-0000-4000-8000-00000000000'||n)::uuid, ('53000000-0000-4000-8000-00000000000'||workspace)::uuid,
    '53000000-0000-4000-8000-00000000000'||workspace||'/54000000-0000-4000-8000-00000000000'||n,
    w.owner_id, w.owner_id, 'image/png', 100, 'ready'
  from call_fixtures join public.workspaces w on w.id = ('53000000-0000-4000-8000-00000000000'||workspace)::uuid;
insert into public.activities(id,workspace_id,case_id,created_by,title,instructions,status,published_at)
  select ('52000000-0000-4000-8000-00000000000'||n)::uuid, c.workspace_id, c.id, c.uploaded_by, 'Calls activity '||n, 'Review this chest X-ray.', 'published', now()
  from call_fixtures join public.xray_cases c on c.id = ('54000000-0000-4000-8000-00000000000'||n)::uuid;
insert into public.ai_analyses(activity_id,status,model_release_id,model_release_id_text,model_sha256,bundle_sha256,manifest_version,
    preprocessing_version,threshold_version,execution_provider,application_build,probabilities,thresholds,findings,completed_at)
  select ('52000000-0000-4000-8000-00000000000'||n)::uuid, status,
    case when status='ready' then 1 end, case when status='ready' then 'calls' end,
    case when status='ready' then repeat('a',64) end, case when status='ready' then repeat('b',64) end,
    case when status='ready' then 1 end, case when status='ready' then 'v1' end, case when status='ready' then 'v1' end,
    case when status='ready' then 'wasm' end, case when status='ready' then 'test' end,
    case when status='ready' then (select jsonb_agg(0.1) from generate_series(1,14)) end,
    case when status='ready' then (select jsonb_agg(jsonb_build_object('label','x','threshold',0.5)) from generate_series(1,14)) end,
    findings, case when status='ready' then now() end
  from call_fixtures;
set local session_replication_role = origin;

set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);
select results_eq(
  $$select activity_id::text, ai_call from public.get_professor_workspace_ai_calls('53000000-0000-4000-8000-00000000000a') order by activity_id$$,
  $$values ('52000000-0000-4000-8000-000000000001','abnormal'), ('52000000-0000-4000-8000-000000000002','normal')$$,
  'any finding besides No Finding is abnormal; empty findings and pending analyses make no call; other workspaces excluded');
select is_empty($$select * from public.get_professor_workspace_ai_calls('53000000-0000-4000-8000-00000000000b')$$, 'professor cannot read another workspace');

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000003',true);
select is_empty($$select * from public.get_professor_workspace_ai_calls('53000000-0000-4000-8000-00000000000a')$$, 'student member gets no calls');

select set_config('request.jwt.claim.sub','',true);
select is_empty($$select * from public.get_professor_workspace_ai_calls('53000000-0000-4000-8000-00000000000a')$$, 'no caller gets no calls');
reset role;

select * from finish();
rollback;
