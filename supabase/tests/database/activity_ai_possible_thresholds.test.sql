begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
create function pg_temp.uid(i integer) returns uuid language sql as $$ select ('88888888-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid $$;
create function pg_temp.label_names() returns text[] language sql as $$ select array['No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity','Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis','Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices'] $$;
-- V1 manifest; with_possible adds a per-label possibleThreshold (Edema 0.3, all others 0.25).
create function pg_temp.manifest(release text, sha text, with_possible boolean) returns jsonb language sql as $$
 select jsonb_build_object('schemaVersion',1,'release',jsonb_build_object('id',release,'preprocessingVersion','prep','thresholdVersion','threshold'),
  'artifact',jsonb_build_object('sha256',sha,'path','artifacts/sha256/'||sha||'/model.onnx'),
  'labels',(select jsonb_agg(jsonb_build_object('name',name,'threshold',0.5) || case when with_possible then jsonb_build_object('possibleThreshold',case when name='Edema' then 0.3 else 0.25 end) else '{}'::jsonb end order by ordinality) from unnest(pg_temp.label_names()) with ordinality as l(name,ordinality)))
$$;
-- Cardiomegaly likely (0.8), Edema possible (0.4), everything else below both thresholds.
create function pg_temp.probabilities() returns jsonb language sql as $$ select '[0.1,0.1,0.8,0.1,0.1,0.4,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1]'::jsonb $$;
create function pg_temp.provenance(release text, sha text, bundle text) returns jsonb language sql as $$
 select jsonb_build_object('releaseId',release,'bundleSha256',bundle,'modelSha256',sha,'manifestVersion',1,'preprocessingVersion','prep','thresholdVersion','threshold')
$$;

insert into auth.users(id,raw_user_meta_data) select pg_temp.uid(i), '{"display_name":"Possible threshold test"}'::jsonb from generate_series(1,3) i;
update public.profiles set role='professor' where id=pg_temp.uid(1);
insert into public.professor_applications(user_id,status,reviewed_at) values(pg_temp.uid(1),'approved',now()) on conflict(user_id) do update set status='approved',reviewed_at=now();
insert into public.workspaces(id,name,owner_id) values(pg_temp.uid(10),'Possible threshold workspace',pg_temp.uid(1));
insert into public.workspace_members(workspace_id,user_id,role) values(pg_temp.uid(10),pg_temp.uid(1),'professor'),(pg_temp.uid(10),pg_temp.uid(2),'student'),(pg_temp.uid(10),pg_temp.uid(3),'student') on conflict do nothing;
-- Two activities: one analysed under a release with possible thresholds, one under a release without.
insert into public.xray_cases(id,workspace_id,storage_path,uploaded_by,mime_type,byte_size,upload_status,attested_by) select pg_temp.uid(i),pg_temp.uid(10),pg_temp.uid(10)::text||'/'||pg_temp.uid(i)::text,pg_temp.uid(1),'image/png',1,'ready',pg_temp.uid(1) from generate_series(20,21) i;
insert into public.activities(id,workspace_id,case_id,created_by,title,instructions) select pg_temp.uid(i+10),pg_temp.uid(10),pg_temp.uid(i),pg_temp.uid(1),'Possible threshold activity','Synthetic testing instructions' from generate_series(20,21) i;
insert into public.activity_reference_evaluations(activity_id,evaluation) select pg_temp.uid(i),'Private reference' from generate_series(30,31) i on conflict(activity_id) do update set evaluation=excluded.evaluation;
update public.activities set status='published' where id in (pg_temp.uid(30),pg_temp.uid(31));
insert into public.student_submissions(activity_id,student_id,visible_findings,classification,status,submitted_at,created_at,updated_at) select pg_temp.uid(i),pg_temp.uid(2),'Synthetic findings','normal','submitted',now(),now(),now() from generate_series(30,31) i;

-- Release with possible thresholds.
select public.register_model_release('possible-tiered',repeat('e',64),repeat('f',64),1024,'artifacts/sha256/'||repeat('e',64)||'/model.onnx','bundles/sha256/'||repeat('f',64)||'/manifest.json',pg_temp.manifest('possible-tiered',repeat('e',64),true),'{"passed":true}'::jsonb,'test');
select public.activate_model_release((select id from public.model_releases where release_id='possible-tiered'),(select revision from public.model_slots where slot='thoraxscan-classifier'),'test','possible threshold test');
select set_config('request.jwt.claim.sub',pg_temp.uid(2)::text,true);
create temp table claim_tiered as select * from public.claim_activity_ai_analysis(pg_temp.uid(30));
select is(public.complete_activity_ai_analysis(pg_temp.uid(30),(select attempt_id from claim_tiered),pg_temp.probabilities(),pg_temp.provenance('possible-tiered',repeat('e',64),repeat('f',64)),'wasm','test',null),'ready','release with possible thresholds completes');
create temp table tiered as select * from public.get_student_activity_ai_feedback(pg_temp.uid(30));
select is((select status from tiered),'released','submitted student receives the released result');
select is((select jsonb_array_length(thresholds) from tiered),14,'all 14 thresholds are stored');
select is((select count(*) from tiered, jsonb_array_elements(thresholds) item where item ? 'possibleThreshold' and jsonb_typeof(item -> 'possibleThreshold') = 'number'),14::bigint,'every label keeps its possible threshold');
select is((select (thresholds -> 5 ->> 'possibleThreshold')::numeric from tiered),0.3,'possible threshold matches the release manifest');
select is((select (thresholds -> 2 ->> 'possibleThreshold')::numeric from tiered),0.25,'each label keeps its own possible threshold');
select is((select array_agg(item ->> 'label' order by ordinality) from tiered, jsonb_array_elements(thresholds) with ordinality as t(item,ordinality)),pg_temp.label_names(),'label names and order are unchanged');
select is((select count(*) from tiered, jsonb_array_elements(thresholds) item where (item ->> 'threshold')::numeric = 0.5),14::bigint,'main thresholds are unchanged');
select is((select probabilities from tiered),pg_temp.probabilities(),'raw probabilities are stored for the client to tier');
select is((select array_agg(item ->> 'label') from tiered, jsonb_array_elements(findings) item),array['Cardiomegaly'],'findings still hold only threshold matches, not possible ones');

-- Release without possible thresholds stores null, which the app treats as "no possible tier".
select public.register_model_release('possible-plain',repeat('1',64),repeat('2',64),1024,'artifacts/sha256/'||repeat('1',64)||'/model.onnx','bundles/sha256/'||repeat('2',64)||'/manifest.json',pg_temp.manifest('possible-plain',repeat('1',64),false),'{"passed":true}'::jsonb,'test');
select public.activate_model_release((select id from public.model_releases where release_id='possible-plain'),(select revision from public.model_slots where slot='thoraxscan-classifier'),'test','plain release test');
create temp table claim_plain as select * from public.claim_activity_ai_analysis(pg_temp.uid(31));
select is(public.complete_activity_ai_analysis(pg_temp.uid(31),(select attempt_id from claim_plain),pg_temp.probabilities(),pg_temp.provenance('possible-plain',repeat('1',64),repeat('2',64)),'wasm','test',null),'ready','release without possible thresholds still completes');
create temp table plain as select * from public.get_student_activity_ai_feedback(pg_temp.uid(31));
select is((select count(*) from plain, jsonb_array_elements(thresholds) item where item -> 'possibleThreshold' = 'null'::jsonb),14::bigint,'missing possible thresholds are stored as null');
select is((select count(*) from plain, jsonb_array_elements(thresholds) item where (item ->> 'threshold')::numeric = 0.5),14::bigint,'main thresholds are stored without possible thresholds');

-- Thresholds stay private until the student submits.
select set_config('request.jwt.claim.sub',pg_temp.uid(3)::text,true);
select is((select status from public.get_student_activity_ai_feedback(pg_temp.uid(30))),'locked','unsubmitted student remains locked');
select is((select thresholds from public.get_student_activity_ai_feedback(pg_temp.uid(30))),null::jsonb,'unsubmitted student receives no thresholds');

select * from finish();
rollback;
