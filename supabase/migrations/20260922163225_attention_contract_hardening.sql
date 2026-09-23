-- V2 attention output rollout. Existing V1 analyses remain immutable and unavailable.
alter table public.model_releases drop constraint if exists model_releases_contract_version_valid;
alter table public.model_releases add constraint model_releases_contract_version_valid check (contract_version in (1, 2));
alter table public.model_releases drop constraint if exists model_releases_manifest_valid;
alter table public.model_releases add constraint model_releases_manifest_valid check (
  jsonb_typeof(manifest) = 'object' and manifest ->> 'schemaVersion' in ('1', '2')
  and manifest #>> '{release,id}' = release_id and manifest #>> '{artifact,sha256}' = model_sha256
  and manifest #>> '{artifact,path}' = model_path
  and (contract_version = 1 or (manifest ->> 'schemaVersion' = '2' and manifest #>> '{attention,output,name}' = 'attention_map' and manifest #>> '{attention,aggregation}' = 'attention-rollout-mean-query-v1'))
);
alter table public.ai_analyses add column if not exists attention_map jsonb;
alter table public.ai_analyses add column if not exists attention_grid_width smallint;
alter table public.ai_analyses add column if not exists attention_grid_height smallint;
alter table public.ai_analyses add column if not exists attention_method text;
alter table public.ai_analyses add column if not exists attention_normalization text;
alter table public.ai_analyses drop constraint if exists ai_analyses_attention_status_valid;
alter table public.ai_analyses add constraint ai_analyses_attention_status_valid check (
  (attention_status = 'unavailable' and attention_map is null and attention_grid_width is null and attention_grid_height is null and attention_method is null and attention_normalization is null)
  or (attention_status = 'ready' and jsonb_typeof(attention_map) = 'array' and jsonb_array_length(attention_map) = 49 and attention_grid_width = 7 and attention_grid_height = 7 and attention_method = 'global-self-attention' and attention_normalization = 'per-image-min-max-v1' and not jsonb_path_exists(attention_map, '$[*] ? (@ < 0 || @ > 1)'))
);
alter table public.ai_analyses drop constraint if exists ai_analyses_ready_payload_valid;
alter table public.ai_analyses add constraint ai_analyses_ready_payload_valid check (
  status <> 'ready' or (probabilities is not null and jsonb_typeof(probabilities) = 'array' and jsonb_array_length(probabilities) = 14 and thresholds is not null and jsonb_typeof(thresholds) = 'array' and jsonb_array_length(thresholds) = 14 and findings is not null and jsonb_typeof(findings) = 'array' and model_release_id is not null and model_release_id_text is not null and model_sha256 is not null and bundle_sha256 is not null and manifest_version in (1, 2) and preprocessing_version is not null and threshold_version is not null and execution_provider is not null and application_build is not null and completed_at is not null and (manifest_version = 1 or attention_status = 'ready'))
);


-- Correct partially installed V2 schemas without resetting data or changing ready rows.
create or replace function private.valid_normalized_vector(value jsonb, expected_length integer)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
begin
  if value is null or jsonb_typeof(value) <> 'array' then return false; end if;
  if jsonb_array_length(value) <> expected_length then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'number' then return false; end if;
    if item::numeric < 0 or item::numeric > 1 then return false; end if;
  end loop;
  return true;
end; $$;
revoke all on function private.valid_normalized_vector(jsonb,integer) from public, anon, authenticated;
alter table public.ai_analyses drop constraint ai_analyses_attention_status_valid;
alter table public.ai_analyses add constraint ai_analyses_attention_status_valid check ((
  (attention_status = 'unavailable' and attention_map is null and attention_grid_width is null and attention_grid_height is null and attention_method is null and attention_normalization is null and (status <> 'ready' or manifest_version = 1))
  or (status = 'ready' and manifest_version = 2 and attention_status = 'ready' and private.valid_normalized_vector(attention_map,49) and attention_grid_width = 7 and attention_grid_height = 7 and attention_method = 'attention-rollout-mean-query-v1' and attention_normalization = 'per-image-min-max-v1')
) is true);
alter table public.model_releases drop constraint model_releases_manifest_valid;
alter table public.model_releases add constraint model_releases_manifest_valid check ((
 jsonb_typeof(manifest) = 'object' and manifest ->> 'schemaVersion' = contract_version::text
 and manifest #>> '{release,id}' = release_id and manifest #>> '{artifact,sha256}' = model_sha256 and manifest #>> '{artifact,path}' = model_path
 and (contract_version = 1 or manifest -> 'attention' = '{"output":{"name":"attention_map","dtype":"float32","shape":["batch",1,7,7]},"attribution":"global-self-attention","aggregation":"attention-rollout-mean-query-v1","normalization":"per-image-min-max-v1","grid":{"width":7,"height":7}}'::jsonb)
) is true);
create or replace function public.complete_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid,
  input_probabilities jsonb, release_provenance jsonb, provider text, application_build text, input_attention_map jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); analysis_row public.ai_analyses%rowtype; activity_row public.activities%rowtype;
  slot_row public.model_slots%rowtype; active_release public.model_releases%rowtype; labels jsonb; thresholds_out jsonb; findings_out jsonb;
  expected_labels text[] := array['No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity','Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis','Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices'];
begin
  if caller_id is null or target_attempt_id is null
    or not private.valid_normalized_vector(input_probabilities, 14)
    or provider is null or provider not in ('webgpu', 'wasm')
    or application_build is null or btrim(application_build) = '' or char_length(application_build) > 200 then return 'invalid_payload'; end if;
  select * into activity_row from public.activities where id = target_activity_id and public.activities.status = 'published';
  if not found or not (private.is_workspace_member(activity_row.workspace_id) or private.is_workspace_professor(activity_row.workspace_id)) then return 'unauthorized'; end if;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id for update;
  if not found then return 'stale_attempt'; end if;
  if analysis_row.status = 'ready' and analysis_row.attempt_id = target_attempt_id then return 'ready'; end if;
  if analysis_row.status <> 'pending' or analysis_row.attempt_id <> target_attempt_id or analysis_row.claimed_by <> caller_id or analysis_row.claim_expires_at <= now() then return 'stale_attempt'; end if;
  select slot.* into slot_row from public.model_slots slot where slot.slot = 'thoraxscan-classifier';
  select release.* into active_release from public.model_releases release where release.id = slot_row.active_model_release_id;
  if active_release.id is null or release_provenance ->> 'releaseId' is distinct from active_release.release_id or release_provenance ->> 'bundleSha256' is distinct from active_release.bundle_sha256 or release_provenance ->> 'modelSha256' is distinct from active_release.model_sha256 or release_provenance ->> 'manifestVersion' is distinct from active_release.contract_version::text or release_provenance ->> 'preprocessingVersion' is distinct from active_release.manifest #>> '{release,preprocessingVersion}' or release_provenance ->> 'thresholdVersion' is distinct from active_release.manifest #>> '{release,thresholdVersion}' then return 'stale_release'; end if;
  if (active_release.contract_version = 1 and input_attention_map is not null)
    or (active_release.contract_version = 2 and not private.valid_normalized_vector(input_attention_map, 49)) then return 'invalid_payload'; end if;
  labels := active_release.manifest -> 'labels';
  if jsonb_array_length(labels) <> 14 then return 'invalid_release'; end if;
  for label_index in 0..13 loop
    if (labels -> label_index) ->> 'name' is distinct from expected_labels[label_index + 1] or ((labels -> label_index) ->> 'threshold')::numeric < 0 or ((labels -> label_index) ->> 'threshold')::numeric > 1 then return 'invalid_release'; end if;
  end loop;
  thresholds_out := (select jsonb_agg(jsonb_build_object('label', item ->> 'name', 'threshold', (item ->> 'threshold')::numeric) order by ordinality) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  findings_out := (select coalesce(jsonb_agg(jsonb_build_object('label', item ->> 'name', 'probability', (input_probabilities -> ((ordinality - 1)::integer))::numeric, 'threshold', (item ->> 'threshold')::numeric, 'predicted', true) order by ordinality) filter (where (input_probabilities -> ((ordinality - 1)::integer))::text::numeric >= (item ->> 'threshold')::numeric and item ->> 'name' <> 'No Finding'), '[]'::jsonb) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  if findings_out = '[]'::jsonb and (input_probabilities -> 0)::text::numeric >= ((labels -> 0) ->> 'threshold')::numeric then findings_out := jsonb_build_array(jsonb_build_object('label', 'No Finding', 'probability', (input_probabilities -> 0)::text::numeric, 'threshold', ((labels -> 0) ->> 'threshold')::numeric, 'predicted', true)); end if;
  update public.ai_analyses as analysis set status = 'ready', claimed_by = null, claim_expires_at = null, safe_error_code = null, model_release_id = active_release.id, model_release_id_text = active_release.release_id, model_sha256 = active_release.model_sha256, bundle_sha256 = active_release.bundle_sha256, manifest_version = active_release.contract_version, preprocessing_version = active_release.manifest #>> '{release,preprocessingVersion}', threshold_version = active_release.manifest #>> '{release,thresholdVersion}', execution_provider = provider, application_build = btrim(complete_activity_ai_analysis.application_build), probabilities = input_probabilities, thresholds = thresholds_out, findings = findings_out, attention_status = case when active_release.contract_version = 2 then 'ready' else 'unavailable' end, attention_map = input_attention_map, attention_grid_width = case when active_release.contract_version = 2 then 7 end, attention_grid_height = case when active_release.contract_version = 2 then 7 end, attention_method = case when active_release.contract_version = 2 then 'attention-rollout-mean-query-v1' end, attention_normalization = case when active_release.contract_version = 2 then 'per-image-min-max-v1' end, completed_at = now(), updated_at = now() where analysis.id = analysis_row.id;
  perform private.sync_activity_ai_feedback(target_activity_id);
  return 'ready';
end;
$$;


create or replace function public.complete_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid, input_probabilities jsonb, release_provenance jsonb, provider text, application_build text)
returns text language sql security definer set search_path = '' as $$
 select public.complete_activity_ai_analysis(target_activity_id,target_attempt_id,input_probabilities,release_provenance,provider,application_build,null::jsonb);
$$;
-- Remove the broken renamed implementation left by partial early V2 installs.
-- The public six-argument compatibility wrapper above remains available.
drop function if exists public.complete_activity_ai_analysis_v1(uuid,uuid,jsonb,jsonb,text,text);
drop function public.get_student_activity_ai_feedback(uuid);
create function public.get_student_activity_ai_feedback(target_activity_id uuid)
returns table (status text, attempt_count integer, safe_error_code text, attempted_at timestamptz, completed_at timestamptz,
  probabilities jsonb, thresholds jsonb, findings jsonb, provenance jsonb, attention_status text, attention_map jsonb, attention_grid_width smallint, attention_grid_height smallint, attention_method text, attention_normalization text)
language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype; release_row public.ai_feedback_releases%rowtype;
begin
  if caller_id is null then return; end if;
  select activity.* into activity_row from public.activities as activity where activity.id = target_activity_id and activity.status = 'published';
  if not found or private.current_profile_role() is distinct from 'student' or not private.is_workspace_member(activity_row.workspace_id) then return; end if;
  select * into release_row from public.ai_feedback_releases where activity_id = target_activity_id and student_id = caller_id order by created_at desc limit 1;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id;
  if not exists (select 1 from public.student_submissions as submission where submission.activity_id = target_activity_id and submission.student_id = caller_id and submission.status = 'submitted') then
    return query select 'locked'::text, coalesce(analysis_row.attempt_count, 0), null::text, null::timestamptz, null::timestamptz, null::jsonb, null::jsonb, null::jsonb, null::jsonb, 'unavailable'::text, null::jsonb, null::smallint, null::smallint, null::text, null::text; return;
  end if;
  return query select coalesce(release_row.status, case when analysis_row.status = 'failed' then 'failed' else 'pending_analysis' end), coalesce(analysis_row.attempt_count, 0), analysis_row.safe_error_code, analysis_row.attempted_at, analysis_row.completed_at, case when release_row.status = 'released' then analysis_row.probabilities else null end, case when release_row.status = 'released' then analysis_row.thresholds else null end, case when release_row.status = 'released' then analysis_row.findings else null end, case when release_row.status = 'released' then jsonb_build_object('releaseId', analysis_row.model_release_id_text, 'modelSha256', analysis_row.model_sha256, 'bundleSha256', analysis_row.bundle_sha256, 'manifestVersion', analysis_row.manifest_version, 'preprocessingVersion', analysis_row.preprocessing_version, 'thresholdVersion', analysis_row.threshold_version, 'executionProvider', analysis_row.execution_provider, 'applicationBuild', analysis_row.application_build) else null end, case when release_row.status = 'released' then analysis_row.attention_status else 'unavailable' end, case when release_row.status = 'released' then analysis_row.attention_map end, case when release_row.status = 'released' then analysis_row.attention_grid_width end, case when release_row.status = 'released' then analysis_row.attention_grid_height end, case when release_row.status = 'released' then analysis_row.attention_method end, case when release_row.status = 'released' then analysis_row.attention_normalization end;
end;
$$;
create or replace function public.get_professor_activity_ai_heatmap(target_activity_id uuid)
returns table (attention_status text, attention_map jsonb, attention_grid_width smallint, attention_grid_height smallint, attention_method text, attention_normalization text, release_id text, manifest_version smallint)
language sql stable security definer set search_path = '' as $$
 select a.attention_status,a.attention_map,a.attention_grid_width,a.attention_grid_height,a.attention_method,a.attention_normalization,a.model_release_id_text,a.manifest_version
 from public.ai_analyses a join public.activities activity on activity.id = a.activity_id
 where auth.uid() is not null and activity.id = target_activity_id and private.is_workspace_professor(activity.workspace_id) and a.status = 'ready';
$$;
revoke all on function public.complete_activity_ai_analysis(uuid,uuid,jsonb,jsonb,text,text,jsonb) from public,anon;
grant execute on function public.complete_activity_ai_analysis(uuid,uuid,jsonb,jsonb,text,text,jsonb) to authenticated;

create or replace function public.get_professor_activity_ai_status(target_activity_id uuid)
returns table (status text, attempt_count integer, safe_error_code text, attempted_at timestamptz, claim_expires_at timestamptz, completed_at timestamptz,
  release_id text, manifest_version smallint, preprocessing_version text, threshold_version text, execution_provider text,
  application_build text, attention_status text)
language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype;
begin
  if caller_id is null then return; end if;
  select * into activity_row from public.activities where id = target_activity_id;
  if not found or not private.is_workspace_professor(activity_row.workspace_id) then return; end if;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id;
  return query select coalesce(analysis_row.status, 'not_started'), coalesce(analysis_row.attempt_count, 0), analysis_row.safe_error_code,
    analysis_row.attempted_at, analysis_row.claim_expires_at, analysis_row.completed_at, analysis_row.model_release_id_text, analysis_row.manifest_version,
    analysis_row.preprocessing_version, analysis_row.threshold_version, analysis_row.execution_provider, analysis_row.application_build,
    coalesce(analysis_row.attention_status, 'unavailable');
end;
$$;

revoke all on function public.get_student_activity_ai_feedback(uuid) from public,anon;
grant execute on function public.get_student_activity_ai_feedback(uuid) to authenticated;
revoke all on function public.get_professor_activity_ai_heatmap(uuid) from public,anon;
grant execute on function public.get_professor_activity_ai_heatmap(uuid) to authenticated;
