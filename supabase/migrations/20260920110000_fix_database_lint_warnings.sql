-- Resolve pgTAP/plpgsql_check findings without changing the public contracts.
create or replace function public.activate_model_release(
  target_model_release_id bigint,
  expected_revision bigint,
  actor text,
  reason text
)
returns table (previous_model_release_id bigint, active_model_release_id bigint, revision bigint)
language plpgsql
set search_path = ''
as $$
declare
  current_slot public.model_slots%rowtype;
  next_revision bigint;
begin
  if actor is null or btrim(actor) = '' or reason is null or btrim(reason) = '' then
    raise exception using errcode = '22023', message = 'actor and reason are required';
  end if;
  select slot.* into current_slot from public.model_slots as slot
    where slot.slot = 'thoraxscan-classifier' for update;
  if current_slot.revision <> expected_revision then
    raise exception using errcode = '40001', message = 'model slot revision changed';
  end if;
  if target_model_release_id is not null and not exists (
    select 1 from public.model_releases as release
    where release.id = target_model_release_id and release.slot = current_slot.slot
  ) then
    raise exception using errcode = '22023', message = 'model release is unavailable';
  end if;
  if current_slot.active_model_release_id is not distinct from target_model_release_id then
    raise exception using errcode = '22023', message = 'model release is already active';
  end if;
  next_revision := current_slot.revision + 1;
  update public.model_slots as slot set active_model_release_id = target_model_release_id,
    revision = next_revision, activated_by = btrim(actor), activated_at = now()
    where slot.slot = current_slot.slot;
  insert into public.model_activation_events (slot, previous_model_release_id, active_model_release_id,
    revision, activated_by, reason)
  values (current_slot.slot, current_slot.active_model_release_id, target_model_release_id,
    next_revision, btrim(actor), btrim(reason));
  return query select current_slot.active_model_release_id, target_model_release_id, next_revision;
end;
$$;

create or replace function public.claim_activity_ai_analysis(target_activity_id uuid)
returns table (status text, attempt_id uuid, attempt_count integer, claim_expires_at timestamptz,
  model_release_id bigint, release_id text, bundle_sha256 text, manifest jsonb)
language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype;
  active_release public.model_releases%rowtype; slot_row public.model_slots%rowtype; new_attempt uuid;
begin
  if caller_id is null then return; end if;
  select * into activity_row from public.activities where id = target_activity_id for share;
  if not found or activity_row.status <> 'published' or activity_row.case_id is null then return; end if;
  if not exists (select 1 from public.xray_cases where id = activity_row.case_id and workspace_id = activity_row.workspace_id and upload_status = 'ready') then return; end if;
  if not (private.is_workspace_member(activity_row.workspace_id) or private.is_workspace_professor(activity_row.workspace_id)) then return; end if;
  if not exists (select 1 from public.student_submissions as submission where submission.activity_id = target_activity_id and submission.status = 'submitted') then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_activity_id::text, 0));
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id for update;
  select slot.* into slot_row from public.model_slots slot where slot.slot = 'thoraxscan-classifier' for share;
  if slot_row.active_model_release_id is null then return; end if;
  select release.* into active_release from public.model_releases release where release.id = slot_row.active_model_release_id;
  if analysis_row.status = 'ready' then
    return query select analysis_row.status, analysis_row.attempt_id, analysis_row.attempt_count, analysis_row.claim_expires_at, active_release.id, active_release.release_id, active_release.bundle_sha256, active_release.manifest; return;
  end if;
  if analysis_row.status = 'pending' and analysis_row.claim_expires_at > now() then
    return query select analysis_row.status, analysis_row.attempt_id, analysis_row.attempt_count, analysis_row.claim_expires_at, active_release.id, active_release.release_id, active_release.bundle_sha256, active_release.manifest; return;
  end if;
  new_attempt := gen_random_uuid();
  insert into public.ai_analyses (activity_id, status, attempt_id, claimed_by, claim_expires_at, attempt_count, attempted_at)
  values (target_activity_id, 'pending', new_attempt, caller_id, now() + interval '5 minutes', coalesce(analysis_row.attempt_count, 0) + 1, now())
  on conflict (activity_id) do update set status = 'pending', attempt_id = excluded.attempt_id,
    claimed_by = excluded.claimed_by, claim_expires_at = excluded.claim_expires_at,
    attempt_count = public.ai_analyses.attempt_count + 1, attempted_at = excluded.attempted_at, safe_error_code = null;
  return query select 'pending'::text, new_attempt, coalesce(analysis_row.attempt_count, 0) + 1, now() + interval '5 minutes', active_release.id, active_release.release_id, active_release.bundle_sha256, active_release.manifest;
end;
$$;

create or replace function public.complete_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid,
  input_probabilities jsonb, release_provenance jsonb, provider text, application_build text)
returns text language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); analysis_row public.ai_analyses%rowtype; activity_row public.activities%rowtype;
  slot_row public.model_slots%rowtype; active_release public.model_releases%rowtype; labels jsonb; thresholds_out jsonb; findings_out jsonb;
  expected_labels text[] := array['No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity','Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis','Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices'];
begin
  if caller_id is null or target_attempt_id is null or jsonb_typeof(input_probabilities) <> 'array' or jsonb_array_length(input_probabilities) <> 14 or provider not in ('webgpu', 'wasm') or application_build is null or btrim(application_build) = '' or char_length(application_build) > 200 then return 'invalid_payload'; end if;
  if exists (select 1 from jsonb_array_elements(input_probabilities) value where jsonb_typeof(value) <> 'number' or value::text::numeric < 0 or value::text::numeric > 1) then return 'invalid_payload'; end if;
  select * into activity_row from public.activities where id = target_activity_id and public.activities.status = 'published';
  if not found or not (private.is_workspace_member(activity_row.workspace_id) or private.is_workspace_professor(activity_row.workspace_id)) then return 'unauthorized'; end if;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id for update;
  if not found then return 'stale_attempt'; end if;
  if analysis_row.status = 'ready' and analysis_row.attempt_id = target_attempt_id then return 'ready'; end if;
  if analysis_row.status <> 'pending' or analysis_row.attempt_id <> target_attempt_id or analysis_row.claimed_by <> caller_id or analysis_row.claim_expires_at <= now() then return 'stale_attempt'; end if;
  select slot.* into slot_row from public.model_slots slot where slot.slot = 'thoraxscan-classifier';
  select release.* into active_release from public.model_releases release where release.id = slot_row.active_model_release_id;
  if active_release.id is null or release_provenance ->> 'releaseId' is distinct from active_release.release_id or release_provenance ->> 'bundleSha256' is distinct from active_release.bundle_sha256 or release_provenance ->> 'modelSha256' is distinct from active_release.model_sha256 or release_provenance ->> 'manifestVersion' is distinct from '1' or release_provenance ->> 'preprocessingVersion' is distinct from active_release.manifest #>> '{release,preprocessingVersion}' or release_provenance ->> 'thresholdVersion' is distinct from active_release.manifest #>> '{release,thresholdVersion}' then return 'stale_release'; end if;
  labels := active_release.manifest -> 'labels';
  if jsonb_array_length(labels) <> 14 then return 'invalid_release'; end if;
  for label_index in 0..13 loop
    if (labels -> label_index) ->> 'name' is distinct from expected_labels[label_index + 1] or ((labels -> label_index) ->> 'threshold')::numeric < 0 or ((labels -> label_index) ->> 'threshold')::numeric > 1 then return 'invalid_release'; end if;
  end loop;
  thresholds_out := (select jsonb_agg(jsonb_build_object('label', item ->> 'name', 'threshold', (item ->> 'threshold')::numeric) order by ordinality) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  findings_out := (select coalesce(jsonb_agg(jsonb_build_object('label', item ->> 'name', 'probability', (input_probabilities -> ((ordinality - 1)::integer))::numeric, 'threshold', (item ->> 'threshold')::numeric, 'predicted', true) order by ordinality) filter (where (input_probabilities -> ((ordinality - 1)::integer))::text::numeric >= (item ->> 'threshold')::numeric and item ->> 'name' <> 'No Finding'), '[]'::jsonb) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  if findings_out = '[]'::jsonb and (input_probabilities -> 0)::text::numeric >= ((labels -> 0) ->> 'threshold')::numeric then findings_out := jsonb_build_array(jsonb_build_object('label', 'No Finding', 'probability', (input_probabilities -> 0)::text::numeric, 'threshold', ((labels -> 0) ->> 'threshold')::numeric, 'predicted', true)); end if;
  update public.ai_analyses as analysis set status = 'ready', claimed_by = null, claim_expires_at = null, safe_error_code = null, model_release_id = active_release.id, model_release_id_text = active_release.release_id, model_sha256 = active_release.model_sha256, bundle_sha256 = active_release.bundle_sha256, manifest_version = 1, preprocessing_version = active_release.manifest #>> '{release,preprocessingVersion}', threshold_version = active_release.manifest #>> '{release,thresholdVersion}', execution_provider = provider, application_build = btrim(complete_activity_ai_analysis.application_build), probabilities = input_probabilities, thresholds = thresholds_out, findings = findings_out, attention_status = 'unavailable', completed_at = now(), updated_at = now() where analysis.id = analysis_row.id;
  perform private.sync_activity_ai_feedback(target_activity_id);
  return 'ready';
end;
$$;

create or replace function public.fail_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid, safe_error_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid();
begin
  if caller_id is null or safe_error_code is null or safe_error_code not in ('no_active_model','unsupported_manifest','artifact_integrity_failed','preprocessing_failed','model_load_failed','invalid_output','case_unavailable','recording_failed','stale_release','aborted') then return 'invalid_payload'; end if;
  update public.ai_analyses as analysis set status = 'failed', safe_error_code = btrim(fail_activity_ai_analysis.safe_error_code), claimed_by = null, claim_expires_at = null, updated_at = now()
    where analysis.activity_id = target_activity_id and analysis.status = 'pending' and analysis.attempt_id = target_attempt_id and analysis.claimed_by = caller_id;
  if not found then return 'stale_attempt'; end if;
  return 'failed';
end;
$$;

create or replace function public.get_student_activity_ai_feedback(target_activity_id uuid)
returns table (status text, attempt_count integer, safe_error_code text, attempted_at timestamptz, completed_at timestamptz,
  probabilities jsonb, thresholds jsonb, findings jsonb, provenance jsonb, attention_status text)
language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype; release_row public.ai_feedback_releases%rowtype;
begin
  if caller_id is null then return; end if;
  select activity.* into activity_row from public.activities as activity where activity.id = target_activity_id and activity.status = 'published';
  if not found or private.current_profile_role() is distinct from 'student' or not private.is_workspace_member(activity_row.workspace_id) then return; end if;
  select * into release_row from public.ai_feedback_releases where activity_id = target_activity_id and student_id = caller_id order by created_at desc limit 1;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id;
  if not exists (select 1 from public.student_submissions as submission where submission.activity_id = target_activity_id and submission.student_id = caller_id and submission.status = 'submitted') then
    return query select 'locked'::text, coalesce(analysis_row.attempt_count, 0), null::text, null::timestamptz, null::timestamptz, null::jsonb, null::jsonb, null::jsonb, null::jsonb, 'unavailable'::text; return;
  end if;
  return query select coalesce(release_row.status, case when analysis_row.status = 'failed' then 'failed' else 'pending_analysis' end), coalesce(analysis_row.attempt_count, 0), analysis_row.safe_error_code, analysis_row.attempted_at, analysis_row.completed_at, case when release_row.status = 'released' then analysis_row.probabilities else null end, case when release_row.status = 'released' then analysis_row.thresholds else null end, case when release_row.status = 'released' then analysis_row.findings else null end, case when release_row.status = 'released' then jsonb_build_object('releaseId', analysis_row.model_release_id_text, 'modelSha256', analysis_row.model_sha256, 'bundleSha256', analysis_row.bundle_sha256, 'manifestVersion', analysis_row.manifest_version, 'preprocessingVersion', analysis_row.preprocessing_version, 'thresholdVersion', analysis_row.threshold_version, 'executionProvider', analysis_row.execution_provider, 'applicationBuild', analysis_row.application_build) else null end, 'unavailable'::text;
end;
$$;
