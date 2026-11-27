-- Contract V3: per-label class activation maps (14 labels x 14x14) replace global attention for new releases.
-- V3 maps reuse attention_map; attention_method and the grid columns tell the two kinds apart. V1/V2 rows are unchanged.
alter table public.model_releases drop constraint model_releases_contract_version_valid;
alter table public.model_releases add constraint model_releases_contract_version_valid check (contract_version in (1, 2, 3));
alter table public.model_releases drop constraint model_releases_manifest_valid;
alter table public.model_releases add constraint model_releases_manifest_valid check ((
 jsonb_typeof(manifest) = 'object' and manifest ->> 'schemaVersion' = contract_version::text
 and manifest #>> '{release,id}' = release_id and manifest #>> '{artifact,sha256}' = model_sha256 and manifest #>> '{artifact,path}' = model_path
 and (contract_version = 1
  or (contract_version = 2 and manifest -> 'attention' = '{"output":{"name":"attention_map","dtype":"float32","shape":["batch",1,7,7]},"attribution":"global-self-attention","aggregation":"attention-rollout-mean-query-v1","normalization":"per-image-min-max-v1","grid":{"width":7,"height":7}}'::jsonb)
  or (contract_version = 3 and manifest -> 'classActivation' = '{"output":{"name":"class_activation","dtype":"float32","shape":["batch",14,14,14]},"method":"cam-fc-weights-v1","normalization":"relu-per-label-max-v1","grid":{"width":14,"height":14}}'::jsonb))
) is true);

alter table public.ai_analyses drop constraint ai_analyses_attention_status_valid;
alter table public.ai_analyses add constraint ai_analyses_attention_status_valid check ((
  (attention_status = 'unavailable' and attention_map is null and attention_grid_width is null and attention_grid_height is null and attention_method is null and attention_normalization is null and (status <> 'ready' or manifest_version = 1))
  or (status = 'ready' and manifest_version = 2 and attention_status = 'ready' and private.valid_normalized_vector(attention_map,49) and attention_grid_width = 7 and attention_grid_height = 7 and attention_method = 'attention-rollout-mean-query-v1' and attention_normalization = 'per-image-min-max-v1')
  or (status = 'ready' and manifest_version = 3 and attention_status = 'ready' and private.valid_normalized_vector(attention_map,2744) and attention_grid_width = 14 and attention_grid_height = 14 and attention_method = 'cam-fc-weights-v1' and attention_normalization = 'relu-per-label-max-v1')
) is true);
alter table public.ai_analyses drop constraint ai_analyses_ready_payload_valid;
alter table public.ai_analyses add constraint ai_analyses_ready_payload_valid check (
  status <> 'ready' or (probabilities is not null and jsonb_typeof(probabilities) = 'array' and jsonb_array_length(probabilities) = 14 and thresholds is not null and jsonb_typeof(thresholds) = 'array' and jsonb_array_length(thresholds) = 14 and findings is not null and jsonb_typeof(findings) = 'array' and model_release_id is not null and model_release_id_text is not null and model_sha256 is not null and bundle_sha256 is not null and manifest_version in (1, 2, 3) and preprocessing_version is not null and threshold_version is not null and execution_provider is not null and application_build is not null and completed_at is not null and (manifest_version = 1 or attention_status = 'ready'))
);

create or replace function public.register_model_release(target_release_id text, target_model_sha256 text, target_bundle_sha256 text, target_model_byte_size bigint, target_model_path text, target_manifest_path text, target_manifest jsonb, target_validation_summary jsonb, actor text)
returns bigint language plpgsql set search_path = '' as $$
declare existing_release public.model_releases%rowtype; registered_release_id bigint; version smallint;
begin
  version := case target_manifest ->> 'schemaVersion' when '3' then 3 when '2' then 2 else 1 end;
  select * into existing_release from public.model_releases where slot='thoraxscan-classifier' and release_id=target_release_id;
  if found then
    if existing_release.bundle_sha256=target_bundle_sha256 and existing_release.model_sha256=target_model_sha256 and existing_release.manifest=target_manifest then return existing_release.id; end if;
    raise exception using errcode='23505', message='release id is already registered with different content';
  end if;
  insert into public.model_releases(release_id,contract_version,model_sha256,bundle_sha256,model_byte_size,model_path,manifest_path,manifest,validation_summary,registered_by)
  values(target_release_id,version,target_model_sha256,target_bundle_sha256,target_model_byte_size,target_model_path,target_manifest_path,target_manifest,target_validation_summary,actor) returning id into registered_release_id;
  return registered_release_id;
end; $$;

-- Same as 20261025120000, plus the V3 map (2744 values) and its metadata.
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
    or (active_release.contract_version = 2 and not private.valid_normalized_vector(input_attention_map, 49))
    or (active_release.contract_version = 3 and not private.valid_normalized_vector(input_attention_map, 2744)) then return 'invalid_payload'; end if;
  labels := active_release.manifest -> 'labels';
  if jsonb_array_length(labels) <> 14 then return 'invalid_release'; end if;
  for label_index in 0..13 loop
    if (labels -> label_index) ->> 'name' is distinct from expected_labels[label_index + 1] or ((labels -> label_index) ->> 'threshold')::numeric < 0 or ((labels -> label_index) ->> 'threshold')::numeric > 1 then return 'invalid_release'; end if;
  end loop;
  thresholds_out := (select jsonb_agg(jsonb_build_object('label', item ->> 'name', 'threshold', (item ->> 'threshold')::numeric, 'possibleThreshold', (item ->> 'possibleThreshold')::numeric) order by ordinality) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  findings_out := (select coalesce(jsonb_agg(jsonb_build_object('label', item ->> 'name', 'probability', (input_probabilities -> ((ordinality - 1)::integer))::numeric, 'threshold', (item ->> 'threshold')::numeric, 'predicted', true) order by ordinality) filter (where (input_probabilities -> ((ordinality - 1)::integer))::text::numeric >= (item ->> 'threshold')::numeric and item ->> 'name' <> 'No Finding'), '[]'::jsonb) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  if findings_out = '[]'::jsonb and (input_probabilities -> 0)::text::numeric >= ((labels -> 0) ->> 'threshold')::numeric then findings_out := jsonb_build_array(jsonb_build_object('label', 'No Finding', 'probability', (input_probabilities -> 0)::text::numeric, 'threshold', ((labels -> 0) ->> 'threshold')::numeric, 'predicted', true)); end if;
  update public.ai_analyses as analysis set status = 'ready', claimed_by = null, claim_expires_at = null, safe_error_code = null, model_release_id = active_release.id, model_release_id_text = active_release.release_id, model_sha256 = active_release.model_sha256, bundle_sha256 = active_release.bundle_sha256, manifest_version = active_release.contract_version, preprocessing_version = active_release.manifest #>> '{release,preprocessingVersion}', threshold_version = active_release.manifest #>> '{release,thresholdVersion}', execution_provider = provider, application_build = btrim(complete_activity_ai_analysis.application_build), probabilities = input_probabilities, thresholds = thresholds_out, findings = findings_out,
    attention_status = case when active_release.contract_version in (2, 3) then 'ready' else 'unavailable' end, attention_map = input_attention_map,
    attention_grid_width = case active_release.contract_version when 2 then 7 when 3 then 14 end, attention_grid_height = case active_release.contract_version when 2 then 7 when 3 then 14 end,
    attention_method = case active_release.contract_version when 2 then 'attention-rollout-mean-query-v1' when 3 then 'cam-fc-weights-v1' end,
    attention_normalization = case active_release.contract_version when 2 then 'per-image-min-max-v1' when 3 then 'relu-per-label-max-v1' end,
    completed_at = now(), updated_at = now() where analysis.id = analysis_row.id;
  perform private.sync_activity_ai_feedback(target_activity_id);
  return 'ready';
end;
$$;
