-- Keep each label's optional Learning Mode "possible" threshold so activity feedback can show the same tiers.
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
  thresholds_out := (select jsonb_agg(jsonb_build_object('label', item ->> 'name', 'threshold', (item ->> 'threshold')::numeric, 'possibleThreshold', (item ->> 'possibleThreshold')::numeric) order by ordinality) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  findings_out := (select coalesce(jsonb_agg(jsonb_build_object('label', item ->> 'name', 'probability', (input_probabilities -> ((ordinality - 1)::integer))::numeric, 'threshold', (item ->> 'threshold')::numeric, 'predicted', true) order by ordinality) filter (where (input_probabilities -> ((ordinality - 1)::integer))::text::numeric >= (item ->> 'threshold')::numeric and item ->> 'name' <> 'No Finding'), '[]'::jsonb) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  if findings_out = '[]'::jsonb and (input_probabilities -> 0)::text::numeric >= ((labels -> 0) ->> 'threshold')::numeric then findings_out := jsonb_build_array(jsonb_build_object('label', 'No Finding', 'probability', (input_probabilities -> 0)::text::numeric, 'threshold', ((labels -> 0) ->> 'threshold')::numeric, 'predicted', true)); end if;
  update public.ai_analyses as analysis set status = 'ready', claimed_by = null, claim_expires_at = null, safe_error_code = null, model_release_id = active_release.id, model_release_id_text = active_release.release_id, model_sha256 = active_release.model_sha256, bundle_sha256 = active_release.bundle_sha256, manifest_version = active_release.contract_version, preprocessing_version = active_release.manifest #>> '{release,preprocessingVersion}', threshold_version = active_release.manifest #>> '{release,thresholdVersion}', execution_provider = provider, application_build = btrim(complete_activity_ai_analysis.application_build), probabilities = input_probabilities, thresholds = thresholds_out, findings = findings_out, attention_status = case when active_release.contract_version = 2 then 'ready' else 'unavailable' end, attention_map = input_attention_map, attention_grid_width = case when active_release.contract_version = 2 then 7 end, attention_grid_height = case when active_release.contract_version = 2 then 7 end, attention_method = case when active_release.contract_version = 2 then 'attention-rollout-mean-query-v1' end, attention_normalization = case when active_release.contract_version = 2 then 'per-image-min-max-v1' end, completed_at = now(), updated_at = now() where analysis.id = analysis_row.id;
  perform private.sync_activity_ai_feedback(target_activity_id);
  return 'ready';
end;
$$;
