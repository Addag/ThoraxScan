-- New activity flow. The AI reads a draft's case, the Professor validates its labels and heatmaps into
-- an answer key, and only then publishes. Students answer by selecting labels, scored against that key.

-- 1. Label rules shared by the answer key and Student answers.
create function private.answer_labels() returns text[] language sql immutable set search_path = '' as $$
  select array['No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity','Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis','Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices'];
$$;
-- At least one known label, no repeats, and "No Finding" only on its own.
create function private.valid_answer_labels(labels text[]) returns boolean language sql immutable set search_path = '' as $$
  select labels is not null and cardinality(labels) between 1 and 14 and labels <@ private.answer_labels()
    and cardinality(labels) = (select count(distinct label) from unnest(labels) as label)
    and (cardinality(labels) = 1 or not ('No Finding' = any(labels)));
$$;
revoke all on function private.answer_labels() from public, anon;
revoke all on function private.valid_answer_labels(text[]) from public, anon;
-- Check constraints run as the writing role, and Professors update the reference row directly.
grant execute on function private.answer_labels() to authenticated;
grant execute on function private.valid_answer_labels(text[]) to authenticated;
grant execute on function private.valid_normalized_vector(jsonb, integer) to authenticated;

-- 2. The answer key lives on the Professor-only reference row. `evaluation` stays as optional private notes.
alter table public.activity_reference_evaluations
  add column validated_labels text[],
  add column validated_heatmap jsonb,
  add column validated_at timestamptz,
  add constraint activity_reference_key_valid check (
    (validated_labels is null and validated_heatmap is null and validated_at is null)
    or (private.valid_answer_labels(validated_labels) and validated_at is not null
      and (validated_heatmap is null or private.valid_normalized_vector(validated_heatmap, 2744)))
  );

create or replace function private.validate_reference_evaluation_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare activity_status text;
begin
  select activity.status into activity_status from public.activities as activity
  where activity.id = coalesce(new.activity_id, old.activity_id);
  if activity_status = 'archived' then
    raise exception using errcode = '42501', message = 'archived reference evaluations are immutable';
  end if;
  if tg_op = 'UPDATE' then
    if new.activity_id <> old.activity_id then
      raise exception using errcode = '42501', message = 'reference evaluation identity is immutable';
    end if;
    -- Submissions are scored against the key when they are finalized, so it cannot move after publishing.
    if activity_status <> 'draft' and (new.validated_labels is distinct from old.validated_labels
      or new.validated_heatmap is distinct from old.validated_heatmap) then
      raise exception using errcode = '42501', message = 'published answer keys are immutable';
    end if;
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- 3. A draft's AI result belongs to its case: it may be deleted with the draft or when the case changes.
create or replace function private.guard_ai_analysis_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.activities where id = old.activity_id and status = 'draft') then return old; end if;
    raise exception using errcode = '42501', message = 'ready analysis results are immutable';
  end if;
  if old.status = 'ready' then
    raise exception using errcode = '42501', message = 'ready analysis results are immutable';
  end if;
  if new.id <> old.id or new.activity_id <> old.activity_id or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'analysis identity is immutable';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

-- Same as 20260820101401, except: publishing needs a validated answer key instead of reference text,
-- and a draft drops its AI result and key when its case changes or the draft is deleted.
create or replace function private.validate_activity_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  case_is_ready boolean;
  key_is_ready boolean;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.published_at is not null or new.archived_at is not null then
      raise exception using errcode = '23514', message = 'activities must begin as drafts';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception using errcode = '42501', message = 'published activities cannot be deleted';
    end if;
    delete from public.ai_analyses where activity_id = old.id;
    return old;
  end if;

  if new.id <> old.id or new.workspace_id <> old.workspace_id or new.created_by <> old.created_by
    or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'activity identity is immutable';
  end if;

  if old.status = 'draft' and new.status not in ('draft', 'published') then
    raise exception using errcode = '23514', message = 'invalid activity status transition';
  elsif old.status = 'published' and new.status not in ('published', 'archived') then
    raise exception using errcode = '23514', message = 'invalid activity status transition';
  elsif old.status = 'archived' then
    raise exception using errcode = '42501', message = 'archived activities are immutable';
  end if;

  if old.status in ('published', 'archived') and new.case_id is distinct from old.case_id then
    raise exception using errcode = '42501', message = 'published activity cases are immutable';
  end if;

  if old.status = 'draft' and new.case_id is distinct from old.case_id then
    delete from public.ai_analyses where activity_id = old.id;
    update public.activity_reference_evaluations
    set validated_labels = null, validated_heatmap = null, validated_at = null
    where activity_id = old.id and validated_labels is not null;
  end if;

  if old.status = 'draft' and new.status = 'published' then
    select exists (
      select 1 from public.xray_cases as xray_case
      where xray_case.id = new.case_id and xray_case.workspace_id = new.workspace_id
        and xray_case.upload_status = 'ready' and xray_case.attested_at is not null
        and xray_case.view_position = 'frontal' and xray_case.mime_type in ('image/jpeg', 'image/png')
        and xray_case.byte_size between 1 and 6291456
    ) into case_is_ready;
    select exists (
      select 1 from public.activity_reference_evaluations as reference
      where reference.activity_id = new.id and reference.validated_labels is not null
    ) into key_is_ready;

    if not case_is_ready then
      raise exception using errcode = '23514', message = 'a ready frontal X-ray case is required';
    end if;
    if not key_is_ready then
      raise exception using errcode = '23514', message = 'a validated answer key is required';
    end if;
    if new.due_at is not null and new.due_at <= now() then
      raise exception using errcode = '23514', message = 'due date must be in the future when published';
    end if;

    new.published_at = now();
    new.archived_at = null;
  elsif old.status = 'published' and new.status = 'archived' then
    new.published_at = old.published_at;
    new.archived_at = now();
  else
    new.published_at = old.published_at;
    new.archived_at = old.archived_at;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

-- 4. The AI now runs on drafts. Same as 20261114120000 except the status check.
create or replace function public.claim_activity_ai_analysis(target_activity_id uuid)
returns table (status text, attempt_id uuid, attempt_count integer, claim_expires_at timestamptz,
  model_release_id bigint, release_id text, bundle_sha256 text, manifest jsonb)
language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype;
  active_release public.model_releases%rowtype; slot_row public.model_slots%rowtype; new_attempt uuid;
begin
  if caller_id is null then return; end if;
  select * into activity_row from public.activities where id = target_activity_id for share;
  if not found or activity_row.status = 'archived' or activity_row.case_id is null then return; end if;
  if not exists (select 1 from public.xray_cases where id = activity_row.case_id and workspace_id = activity_row.workspace_id and upload_status = 'ready') then return; end if;
  if not private.is_workspace_professor(activity_row.workspace_id) then return; end if;
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

-- Same as 20261029120000 except the activity may be a draft and only a workspace Professor may record.
create or replace function public.complete_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid,
  input_probabilities jsonb, release_provenance jsonb, provider text, application_build text, input_attention_map jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); analysis_row public.ai_analyses%rowtype; activity_row public.activities%rowtype;
  slot_row public.model_slots%rowtype; active_release public.model_releases%rowtype; labels jsonb; thresholds_out jsonb; findings_out jsonb;
  expected_labels text[] := private.answer_labels();
begin
  if caller_id is null or target_attempt_id is null
    or not private.valid_normalized_vector(input_probabilities, 14)
    or provider is null or provider not in ('webgpu', 'wasm')
    or application_build is null or btrim(application_build) = '' or char_length(application_build) > 200 then return 'invalid_payload'; end if;
  select * into activity_row from public.activities where id = target_activity_id and public.activities.status <> 'archived';
  if not found or not private.is_workspace_professor(activity_row.workspace_id) then return 'unauthorized'; end if;
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

-- 5. The Professor needs the AI's finding labels to validate them. Probabilities stay private.
create function public.get_professor_activity_ai_findings(target_activity_id uuid)
returns text[] language sql stable security definer set search_path = '' as $$
  select array(select finding ->> 'label' from jsonb_array_elements(analysis.findings) as finding)
  from public.ai_analyses analysis join public.activities activity on activity.id = analysis.activity_id
  where auth.uid() is not null and activity.id = target_activity_id
    and private.is_workspace_professor(activity.workspace_id) and analysis.status = 'ready';
$$;
revoke all on function public.get_professor_activity_ai_findings(uuid) from public, anon;
grant execute on function public.get_professor_activity_ai_findings(uuid) to authenticated;

-- Saves the Professor's validation of a draft's ready AI result. Labels are stored in canonical order;
-- without an edited heatmap the AI's per-label maps become the key's heatmap.
create function public.save_activity_answer_key(target_activity_id uuid, input_labels text[], input_heatmap jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype;
begin
  if auth.uid() is null then return 'unauthorized'; end if;
  select * into activity_row from public.activities where id = target_activity_id for update;
  if not found or not private.is_workspace_professor(activity_row.workspace_id) then return 'unauthorized'; end if;
  if activity_row.status <> 'draft' then return 'locked'; end if;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id and status = 'ready';
  if not found then return 'analysis_required'; end if;
  if not private.valid_answer_labels(input_labels) is true
    or (input_heatmap is not null and (analysis_row.manifest_version <> 3 or not private.valid_normalized_vector(input_heatmap, 2744)))
  then return 'invalid_payload'; end if;
  update public.activity_reference_evaluations set
    validated_labels = array(select label from unnest(private.answer_labels()) with ordinality as known(label, position)
      where label = any(input_labels) order by position),
    validated_heatmap = coalesce(input_heatmap, case when analysis_row.manifest_version = 3 then analysis_row.attention_map end),
    validated_at = now()
  where activity_id = target_activity_id;
  if not found then return 'unavailable'; end if;
  return 'saved';
end;
$$;
revoke all on function public.save_activity_answer_key(uuid, text[], jsonb) from public, anon;
grant execute on function public.save_activity_answer_key(uuid, text[], jsonb) to authenticated;

-- 6. Student answers are label selections, scored against the key when finalized:
-- correct picks / (key labels + wrong extra picks), so ticking everything does not score 100.
alter table public.student_submissions
  add column selected_labels text[] not null default '{}',
  add column label_score numeric(5,2);
alter table public.student_submissions drop constraint student_submissions_final_fields;
-- Not validated: finals written before this migration are immutable and keep their text answers.
alter table public.student_submissions add constraint student_submissions_final_labels check (
  status <> 'submitted' or (private.valid_answer_labels(selected_labels) and label_score is not null and label_score between 0 and 100)
) not valid;

drop function public.save_student_activity_submission(uuid, text, text, text, boolean);
create function public.save_student_activity_submission(target_activity_id uuid, input_labels text[], finalize boolean default false)
returns text language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  activity public.activities%rowtype;
  existing public.student_submissions%rowtype;
  answer_key text[];
  labels text[];
  correct integer;
  score numeric(5,2);
  saved_at timestamptz;
begin
  if caller is null then return 'unauthorized'; end if;
  -- Hold authorization and activity rows stable through the write.
  perform 1 from public.profiles where id = caller and role = 'student' for share;
  if not found then return 'unauthorized'; end if;
  select * into activity from public.activities where id = target_activity_id for share;
  if not found or activity.status <> 'published' then return 'unavailable'; end if;
  perform 1 from public.workspace_members where workspace_id = activity.workspace_id
    and user_id = caller and role = 'student' for share;
  if not found then return 'unauthorized'; end if;
  -- Activities published before answer keys existed cannot be scored, so they take no new answers.
  select validated_labels into answer_key from public.activity_reference_evaluations where activity_id = target_activity_id;
  if answer_key is null then return 'unavailable'; end if;
  -- Serialize this student/activity pair, including when no draft exists yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_activity_id::text || caller::text, 0));
  select * into existing from public.student_submissions
    where activity_id = target_activity_id and student_id = caller for update;
  if existing.status = 'submitted' then return 'already_submitted'; end if;
  saved_at := clock_timestamp();
  if activity.due_at is not null and saved_at >= activity.due_at then return 'deadline_passed'; end if;
  -- Invalid RPC input maps to the stable unavailable result; the action supplies field errors.
  if finalize is null or not private.valid_answer_labels(input_labels) is true then return 'unavailable'; end if;
  labels := array(select label from unnest(private.answer_labels()) with ordinality as known(label, position)
    where label = any(input_labels) order by position);
  if finalize then
    correct := (select count(*) from unnest(labels) as label where label = any(answer_key));
    score := round(100.0 * correct / (cardinality(answer_key) + cardinality(labels) - correct), 2);
  end if;
  -- classification is derived so class analytics keeps its normal/abnormal comparison.
  insert into public.student_submissions(activity_id, student_id, selected_labels, label_score, classification,
    visible_findings, relevant_region, status, created_at, updated_at, submitted_at)
  values (target_activity_id, caller, labels, score,
    case when labels = array['No Finding'] then 'normal' else 'abnormal' end, '', '',
    case when finalize then 'submitted' else 'draft' end, saved_at, saved_at,
    case when finalize then saved_at end)
  on conflict (activity_id, student_id) do update set
    selected_labels = excluded.selected_labels, label_score = excluded.label_score,
    classification = excluded.classification, visible_findings = '', relevant_region = '',
    status = excluded.status, updated_at = excluded.updated_at, submitted_at = excluded.submitted_at;
  return case when finalize then 'submitted' else 'draft_saved' end;
end;
$$;
revoke all on function public.save_student_activity_submission(uuid, text[], boolean) from public, anon;
grant execute on function public.save_student_activity_submission(uuid, text[], boolean) to authenticated;

-- 7. After a final submission the Student sees the Professor's key: validated labels and edited heatmaps.
-- Same as 20260922163225 plus validated_labels, with the key's heatmap replacing the raw AI map.
drop function public.get_student_activity_ai_feedback(uuid);
create function public.get_student_activity_ai_feedback(target_activity_id uuid)
returns table (status text, attempt_count integer, safe_error_code text, attempted_at timestamptz, completed_at timestamptz,
  probabilities jsonb, thresholds jsonb, findings jsonb, provenance jsonb, attention_status text, attention_map jsonb, attention_grid_width smallint, attention_grid_height smallint, attention_method text, attention_normalization text, validated_labels text[])
language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype; release_row public.ai_feedback_releases%rowtype; key_row public.activity_reference_evaluations%rowtype; released boolean;
begin
  if caller_id is null then return; end if;
  select activity.* into activity_row from public.activities as activity where activity.id = target_activity_id and activity.status = 'published';
  if not found or private.current_profile_role() is distinct from 'student' or not private.is_workspace_member(activity_row.workspace_id) then return; end if;
  select * into release_row from public.ai_feedback_releases where activity_id = target_activity_id and student_id = caller_id order by created_at desc limit 1;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id;
  if not exists (select 1 from public.student_submissions as submission where submission.activity_id = target_activity_id and submission.student_id = caller_id and submission.status = 'submitted') then
    return query select 'locked'::text, coalesce(analysis_row.attempt_count, 0), null::text, null::timestamptz, null::timestamptz, null::jsonb, null::jsonb, null::jsonb, null::jsonb, 'unavailable'::text, null::jsonb, null::smallint, null::smallint, null::text, null::text, null::text[]; return;
  end if;
  released := release_row.status is not distinct from 'released';
  select * into key_row from public.activity_reference_evaluations where activity_id = target_activity_id;
  return query select coalesce(release_row.status, case when analysis_row.status = 'failed' then 'failed' else 'pending_analysis' end), coalesce(analysis_row.attempt_count, 0), analysis_row.safe_error_code, analysis_row.attempted_at, analysis_row.completed_at,
    case when released then analysis_row.probabilities end, case when released then analysis_row.thresholds end, case when released then analysis_row.findings end,
    case when released then jsonb_build_object('releaseId', analysis_row.model_release_id_text, 'modelSha256', analysis_row.model_sha256, 'bundleSha256', analysis_row.bundle_sha256, 'manifestVersion', analysis_row.manifest_version, 'preprocessingVersion', analysis_row.preprocessing_version, 'thresholdVersion', analysis_row.threshold_version, 'executionProvider', analysis_row.execution_provider, 'applicationBuild', analysis_row.application_build) end,
    case when released then analysis_row.attention_status else 'unavailable' end,
    case when released then coalesce(key_row.validated_heatmap, analysis_row.attention_map) end,
    case when released then analysis_row.attention_grid_width end, case when released then analysis_row.attention_grid_height end,
    case when released then analysis_row.attention_method end, case when released then analysis_row.attention_normalization end,
    case when released then key_row.validated_labels end;
end;
$$;
revoke all on function public.get_student_activity_ai_feedback(uuid) from public, anon;
grant execute on function public.get_student_activity_ai_feedback(uuid) to authenticated;
