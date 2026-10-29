begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
create function pg_temp.uid(i integer) returns uuid language sql as $$ select ('88888888-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid $$;
insert into auth.users(id,raw_user_meta_data) select pg_temp.uid(i), '{"display_name":"CAM test"}'::jsonb from generate_series(1,3) i;
update public.profiles set role='professor' where id=pg_temp.uid(1);
insert into public.professor_applications(user_id,status,reviewed_at) values(pg_temp.uid(1),'approved',now()) on conflict(user_id) do update set status='approved',reviewed_at=now();
insert into public.workspaces(id,name,owner_id) values(pg_temp.uid(10),'CAM workspace',pg_temp.uid(1));
insert into public.workspace_members(workspace_id,user_id,role) values(pg_temp.uid(10),pg_temp.uid(1),'professor'),(pg_temp.uid(10),pg_temp.uid(2),'student') on conflict do nothing;
insert into public.xray_cases(id,workspace_id,storage_path,uploaded_by,mime_type,byte_size,upload_status,attested_by) values(pg_temp.uid(20),pg_temp.uid(10),pg_temp.uid(10)::text||'/'||pg_temp.uid(20)::text,pg_temp.uid(1),'image/png',1,'ready',pg_temp.uid(1));
insert into public.activities(id,workspace_id,case_id,created_by,title,instructions) values(pg_temp.uid(30),pg_temp.uid(10),pg_temp.uid(20),pg_temp.uid(1),'CAM activity','Synthetic testing instructions');
insert into public.activity_reference_evaluations(activity_id,evaluation) values(pg_temp.uid(30),'Private reference') on conflict(activity_id) do update set evaluation=excluded.evaluation;
update public.activities set status='published' where id=pg_temp.uid(30);
insert into public.student_submissions(activity_id,student_id,visible_findings,classification,status,submitted_at,created_at,updated_at) values(pg_temp.uid(30),pg_temp.uid(2),'Synthetic findings','normal','submitted',now(),now(),now());
create temp table v3_manifest as select jsonb_build_object(
  'schemaVersion', 3,
  'release', jsonb_build_object('id','v3-behavior','preprocessingVersion','prep','thresholdVersion','threshold'),
  'artifact', jsonb_build_object('sha256',repeat('e',64),'path','artifacts/sha256/'||repeat('e',64)||'/model.onnx'),
  'classActivation', '{"output":{"name":"class_activation","dtype":"float32","shape":["batch",14,14,14]},"method":"cam-fc-weights-v1","normalization":"relu-per-label-max-v1","grid":{"width":14,"height":14}}'::jsonb,
  'labels', (select jsonb_agg(jsonb_build_object('name',name,'threshold',0.5) order by ordinality) from unnest(array['No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity','Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis','Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices']) with ordinality as l(name, ordinality))
) as manifest;
select throws_ok($$select public.register_model_release('v3-bad',repeat('e',64),repeat('f',64),1024,'artifacts/sha256/'||repeat('e',64)||'/model.onnx','bundles/sha256/'||repeat('f',64)||'/manifest.json',
  (select jsonb_set(jsonb_set(manifest,'{classActivation,grid,width}','7'),'{release,id}','"v3-bad"') from v3_manifest),'{"passed":true}','test')$$,'23514',null,'changed V3 descriptor rejected');
select public.register_model_release('v3-behavior',repeat('e',64),repeat('f',64),1024,'artifacts/sha256/'||repeat('e',64)||'/model.onnx','bundles/sha256/'||repeat('f',64)||'/manifest.json',(select manifest from v3_manifest),'{"passed":true}','test');
select is((select contract_version from public.model_releases where release_id = 'v3-behavior'),3::smallint,'V3 registers as contract 3');
select public.activate_model_release((select id from public.model_releases where release_id='v3-behavior'),(select revision from public.model_slots where slot='thoraxscan-classifier'),'test','V3 behavior test');
select set_config('request.jwt.claim.sub',pg_temp.uid(2)::text,true);
create temp table claim as select * from public.claim_activity_ai_analysis(pg_temp.uid(30));
create function pg_temp.complete(map jsonb) returns text language sql as $$
 select public.complete_activity_ai_analysis(pg_temp.uid(30),(select attempt_id from claim),to_jsonb(array_fill(0.6::numeric,array[14])),jsonb_build_object('releaseId','v3-behavior','bundleSha256',repeat('f',64),'modelSha256',repeat('e',64),'manifestVersion',3,'preprocessingVersion','prep','thresholdVersion','threshold'),'wasm','test',map);
$$;
select is(pg_temp.complete(null),'invalid_payload','missing V3 map rejected');
select is(pg_temp.complete(to_jsonb(array_fill(0.5::numeric,array[49]))),'invalid_payload','V2-sized map rejected for V3');
select is(pg_temp.complete(to_jsonb(array_fill(1.5::numeric,array[2744]))),'invalid_payload','out of range rejected');
select is(pg_temp.complete(to_jsonb(array_fill(0.5::numeric,array[2744]))),'ready','valid V3 completes');
select is((select jsonb_array_length(attention_map) from public.get_student_activity_ai_feedback(pg_temp.uid(30))),2744,'student receives 14 per-label maps');
select is((select attention_method || ' ' || attention_grid_width from public.get_student_activity_ai_feedback(pg_temp.uid(30))),'cam-fc-weights-v1 14','student projection carries V3 metadata');
select set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
select is((select manifest_version from public.get_professor_activity_ai_heatmap(pg_temp.uid(30))),3::smallint,'professor receives V3 map');
select set_config('request.jwt.claim.sub',pg_temp.uid(3)::text,true);
select is((select count(*) from public.get_professor_activity_ai_heatmap(pg_temp.uid(30))),0::bigint,'outsider denied');
create temp table cam_constraints (like public.ai_analyses including constraints including defaults);
select throws_ok($$insert into cam_constraints(id,activity_id,status,attention_status,manifest_version,attention_map,attention_grid_width,attention_grid_height,attention_method,attention_normalization) values(gen_random_uuid(),gen_random_uuid(),'ready','ready',3,to_jsonb(array_fill(0.5,array[2744])),7,7,'cam-fc-weights-v1','relu-per-label-max-v1')$$,'23514',null,'V3 row with a 7x7 grid rejected');
select * from finish();
rollback;
