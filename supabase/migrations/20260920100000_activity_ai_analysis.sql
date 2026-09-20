-- Prediction-only activity analysis and controlled feedback release.
-- This migration intentionally keeps inference browser-side: the database accepts
-- only a bounded probability vector and release provenance.

create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null unique references public.activities(id) on delete restrict,
  status text not null default 'pending',
  attempt_id uuid,
  claimed_by uuid references auth.users(id) on delete restrict,
  claim_expires_at timestamptz,
  attempt_count integer not null default 0,
  safe_error_code text,
  model_release_id bigint references public.model_releases(id) on delete restrict,
  model_release_id_text text,
  model_sha256 text,
  bundle_sha256 text,
  manifest_version smallint,
  preprocessing_version text,
  threshold_version text,
  execution_provider text,
  application_build text,
  probabilities jsonb,
  thresholds jsonb,
  findings jsonb,
  attention_status text not null default 'unavailable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  attempted_at timestamptz,
  completed_at timestamptz,
  constraint ai_analyses_status_valid check (status in ('pending', 'ready', 'failed')),
  constraint ai_analyses_attempt_count_valid check (attempt_count >= 0),
  constraint ai_analyses_attention_status_valid check (attention_status = 'unavailable'),
  constraint ai_analyses_provider_valid check (execution_provider is null or execution_provider in ('webgpu', 'wasm')),
  constraint ai_analyses_safe_error_valid check (safe_error_code is null or safe_error_code in ('no_active_model','unsupported_manifest','artifact_integrity_failed','preprocessing_failed','model_load_failed','invalid_output','case_unavailable','recording_failed','stale_release','aborted')),
  constraint ai_analyses_hash_valid check (
    (model_sha256 is null or model_sha256 ~ '^[0-9a-f]{64}$') and
    (bundle_sha256 is null or bundle_sha256 ~ '^[0-9a-f]{64}$')
  ),
  constraint ai_analyses_ready_payload_valid check (
    status <> 'ready' or (
      probabilities is not null and jsonb_typeof(probabilities) = 'array' and jsonb_array_length(probabilities) = 14 and
      thresholds is not null and jsonb_typeof(thresholds) = 'array' and jsonb_array_length(thresholds) = 14 and
      findings is not null and jsonb_typeof(findings) = 'array' and
      model_release_id is not null and model_release_id_text is not null and
      model_sha256 is not null and bundle_sha256 is not null and
      manifest_version = 1 and preprocessing_version is not null and threshold_version is not null and
      execution_provider is not null and application_build is not null and completed_at is not null
    )
  ),
  constraint ai_analyses_lifecycle_valid check (
    (status = 'pending' and completed_at is null) or
    (status = 'failed' and completed_at is null) or
    (status = 'ready' and completed_at is not null)
  )
);

create index ai_analyses_activity_id_idx on public.ai_analyses(activity_id);
create index ai_analyses_model_release_id_idx on public.ai_analyses(model_release_id);
create index ai_analyses_claimed_by_idx on public.ai_analyses(claimed_by);
create index ai_analyses_claim_expires_at_idx on public.ai_analyses(claim_expires_at)
  where status = 'pending';

create table public.ai_feedback_releases (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.student_submissions(id) on delete restrict,
  activity_id uuid not null references public.activities(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending_analysis',
  ai_analysis_id uuid references public.ai_analyses(id) on delete restrict,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_feedback_releases_status_valid check (status in ('pending_analysis', 'released')),
  constraint ai_feedback_releases_release_lifecycle check (
    (status = 'pending_analysis' and released_at is null) or
    (status = 'released' and released_at is not null and ai_analysis_id is not null)
  )
);

create index ai_feedback_releases_activity_id_idx on public.ai_feedback_releases(activity_id);
create index ai_feedback_releases_student_id_idx on public.ai_feedback_releases(student_id);
create index ai_feedback_releases_ai_analysis_id_idx on public.ai_feedback_releases(ai_analysis_id);

create function private.guard_ai_analysis_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' or old.status = 'ready' then
    raise exception using errcode = '42501', message = 'ready analysis results are immutable';
  end if;
  if new.id <> old.id or new.activity_id <> old.activity_id or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'analysis identity is immutable';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create function private.guard_ai_feedback_release_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' or old.status = 'released' then
    raise exception using errcode = '42501', message = 'released feedback records are immutable';
  end if;
  if new.id <> old.id or new.submission_id <> old.submission_id or new.activity_id <> old.activity_id
    or new.student_id <> old.student_id or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'feedback release identity is immutable';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create function private.sync_activity_ai_feedback(target_activity_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare analysis_id uuid;
begin
  select id into analysis_id from public.ai_analyses
  where activity_id = target_activity_id and status = 'ready';

  insert into public.ai_feedback_releases (submission_id, activity_id, student_id, status, ai_analysis_id, released_at)
  select submission.id, submission.activity_id, submission.student_id,
    case when analysis_id is null then 'pending_analysis' else 'released' end,
    analysis_id, case when analysis_id is null then null else now() end
  from public.student_submissions as submission
  where submission.activity_id = target_activity_id and submission.status = 'submitted'
  on conflict (submission_id) do nothing;

  if analysis_id is not null then
    update public.ai_feedback_releases as release
    set status = 'released', ai_analysis_id = analysis_id, released_at = coalesce(release.released_at, now()), updated_at = now()
    where release.activity_id = target_activity_id and release.status = 'pending_analysis';
  end if;
end;
$$;

create function private.sync_submission_ai_feedback()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'submitted' then
    perform private.sync_activity_ai_feedback(new.activity_id);
  end if;
  return new;
end;
$$;

create trigger ai_analyses_guard before update or delete on public.ai_analyses
for each row execute function private.guard_ai_analysis_mutation();
create trigger ai_feedback_releases_guard before update or delete on public.ai_feedback_releases
for each row execute function private.guard_ai_feedback_release_mutation();
create trigger student_submissions_ai_feedback after insert or update on public.student_submissions
for each row when (new.status = 'submitted') execute function private.sync_submission_ai_feedback();

-- Preserve the invariant when this migration is applied to an instance that
-- already contains finalized submissions.
do $$
declare activity_row record;
begin
  for activity_row in select distinct activity_id from public.student_submissions where status = 'submitted' loop
    perform private.sync_activity_ai_feedback(activity_row.activity_id);
  end loop;
end;
$$;

alter table public.ai_analyses enable row level security;
alter table public.ai_feedback_releases enable row level security;
revoke all on table public.ai_analyses from public, anon, authenticated;
revoke all on table public.ai_feedback_releases from public, anon, authenticated;

create function public.claim_activity_ai_analysis(target_activity_id uuid)
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
  if not exists (select 1 from public.student_submissions where activity_id = target_activity_id and status = 'submitted') then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_activity_id::text, 0));
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id for update;
  select slot.* into slot_row from public.model_slots slot where slot.slot = 'thoraxscan-classifier' for share;
  if slot_row.active_model_release_id is null then return; end if;
  select release.* into active_release from public.model_releases release where release.id = slot_row.active_model_release_id;

  if analysis_row.status = 'ready' then
    return query select analysis_row.status, analysis_row.attempt_id, analysis_row.attempt_count, analysis_row.claim_expires_at,
      active_release.id, active_release.release_id, active_release.bundle_sha256, active_release.manifest;
    return;
  end if;
  if analysis_row.status = 'pending' and analysis_row.claim_expires_at > now() then
    return query select analysis_row.status, analysis_row.attempt_id, analysis_row.attempt_count, analysis_row.claim_expires_at,
      active_release.id, active_release.release_id, active_release.bundle_sha256, active_release.manifest;
    return;
  end if;

  new_attempt := gen_random_uuid();
  insert into public.ai_analyses (activity_id, status, attempt_id, claimed_by, claim_expires_at, attempt_count, attempted_at)
  values (target_activity_id, 'pending', new_attempt, caller_id, now() + interval '5 minutes', coalesce(analysis_row.attempt_count, 0) + 1, now())
  on conflict (activity_id) do update set status = 'pending', attempt_id = excluded.attempt_id,
    claimed_by = excluded.claimed_by, claim_expires_at = excluded.claim_expires_at,
    attempt_count = public.ai_analyses.attempt_count + 1, attempted_at = excluded.attempted_at,
    safe_error_code = null;
  return query select 'pending'::text, new_attempt, coalesce(analysis_row.attempt_count, 0) + 1,
    now() + interval '5 minutes', active_release.id, active_release.release_id, active_release.bundle_sha256, active_release.manifest;
end;
$$;

create function public.complete_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid,
  input_probabilities jsonb, release_provenance jsonb, provider text, application_build text)
returns text language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); analysis_row public.ai_analyses%rowtype; activity_row public.activities%rowtype;
  slot_row public.model_slots%rowtype; active_release public.model_releases%rowtype; labels jsonb; thresholds_out jsonb; findings_out jsonb;
  expected_labels text[] := array['No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity','Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis','Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices']; label_index integer;
begin
  if caller_id is null or target_attempt_id is null or jsonb_typeof(input_probabilities) <> 'array'
    or jsonb_array_length(input_probabilities) <> 14 or provider not in ('webgpu', 'wasm')
    or application_build is null or btrim(application_build) = '' or char_length(application_build) > 200 then return 'invalid_payload'; end if;
  if exists (select 1 from jsonb_array_elements(input_probabilities) value where jsonb_typeof(value) <> 'number' or value::text::numeric < 0 or value::text::numeric > 1) then return 'invalid_payload'; end if;
  select * into activity_row from public.activities where id = target_activity_id and status = 'published';
  if not found or not (private.is_workspace_member(activity_row.workspace_id) or private.is_workspace_professor(activity_row.workspace_id)) then return 'unauthorized'; end if;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id for update;
  if not found then return 'stale_attempt'; end if;
  if analysis_row.status = 'ready' and analysis_row.attempt_id = target_attempt_id then return 'ready'; end if;
  if analysis_row.status <> 'pending' or analysis_row.attempt_id <> target_attempt_id or analysis_row.claimed_by <> caller_id or analysis_row.claim_expires_at <= now() then return 'stale_attempt'; end if;
  select slot.* into slot_row from public.model_slots slot where slot.slot = 'thoraxscan-classifier';
  select release.* into active_release from public.model_releases release where release.id = slot_row.active_model_release_id;
  if active_release.id is null or release_provenance ->> 'releaseId' is distinct from active_release.release_id
    or release_provenance ->> 'bundleSha256' is distinct from active_release.bundle_sha256
    or release_provenance ->> 'modelSha256' is distinct from active_release.model_sha256
    or release_provenance ->> 'manifestVersion' is distinct from '1'
    or release_provenance ->> 'preprocessingVersion' is distinct from active_release.manifest #>> '{release,preprocessingVersion}'
    or release_provenance ->> 'thresholdVersion' is distinct from active_release.manifest #>> '{release,thresholdVersion}' then return 'stale_release'; end if;
  labels := active_release.manifest -> 'labels';
  if jsonb_array_length(labels) <> 14 then return 'invalid_release'; end if;
  for label_index in 0..13 loop
    if (labels -> label_index) ->> 'name' is distinct from expected_labels[label_index + 1]
      or ((labels -> label_index) ->> 'threshold')::numeric < 0
      or ((labels -> label_index) ->> 'threshold')::numeric > 1 then return 'invalid_release'; end if;
  end loop;
  thresholds_out := (select jsonb_agg(jsonb_build_object('label', item ->> 'name', 'threshold', (item ->> 'threshold')::numeric) order by ordinality) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  findings_out := (select coalesce(jsonb_agg(jsonb_build_object('label', item ->> 'name', 'probability', (input_probabilities -> (ordinality - 1))::numeric, 'threshold', (item ->> 'threshold')::numeric, 'predicted', true) order by ordinality) filter (where (input_probabilities -> (ordinality - 1))::text::numeric >= (item ->> 'threshold')::numeric and item ->> 'name' <> 'No Finding'), '[]'::jsonb) from jsonb_array_elements(labels) with ordinality as elements(item, ordinality));
  if findings_out = '[]'::jsonb and (input_probabilities -> 0)::text::numeric >= ((labels -> 0) ->> 'threshold')::numeric then findings_out := jsonb_build_array(jsonb_build_object('label', 'No Finding', 'probability', (input_probabilities -> 0)::text::numeric, 'threshold', ((labels -> 0) ->> 'threshold')::numeric, 'predicted', true)); end if;
  update public.ai_analyses set status = 'ready', claimed_by = null, claim_expires_at = null, safe_error_code = null,
    model_release_id = active_release.id, model_release_id_text = active_release.release_id, model_sha256 = active_release.model_sha256,
    bundle_sha256 = active_release.bundle_sha256, manifest_version = 1, preprocessing_version = active_release.manifest #>> '{release,preprocessingVersion}',
    threshold_version = active_release.manifest #>> '{release,thresholdVersion}', execution_provider = provider,
    application_build = btrim(application_build), probabilities = input_probabilities, thresholds = thresholds_out,
    findings = findings_out, attention_status = 'unavailable', completed_at = now(), updated_at = now()
    where id = analysis_row.id;
  perform private.sync_activity_ai_feedback(target_activity_id);
  return 'ready';
end;
$$;

create function public.fail_activity_ai_analysis(target_activity_id uuid, target_attempt_id uuid, safe_error_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid();
begin
  if caller_id is null or safe_error_code is null or safe_error_code not in ('no_active_model','unsupported_manifest','artifact_integrity_failed','preprocessing_failed','model_load_failed','invalid_output','case_unavailable','recording_failed','stale_release','aborted') then return 'invalid_payload'; end if;
  update public.ai_analyses set status = 'failed', safe_error_code = btrim(safe_error_code), claimed_by = null, claim_expires_at = null, updated_at = now()
  where activity_id = target_activity_id and status = 'pending' and attempt_id = target_attempt_id and claimed_by = caller_id;
  if not found then return 'stale_attempt'; end if;
  return 'failed';
end;
$$;

create function public.get_student_activity_ai_feedback(target_activity_id uuid)
returns table (status text, attempt_count integer, safe_error_code text, attempted_at timestamptz, completed_at timestamptz,
  probabilities jsonb, thresholds jsonb, findings jsonb, provenance jsonb, attention_status text)
language plpgsql stable security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); activity_row public.activities%rowtype; analysis_row public.ai_analyses%rowtype; release_row public.ai_feedback_releases%rowtype;
begin
  if caller_id is null then return; end if;
  select * into activity_row from public.activities where id = target_activity_id and status = 'published';
  if not found or private.current_profile_role() is distinct from 'student' or not private.is_workspace_member(activity_row.workspace_id) then return; end if;
  select * into release_row from public.ai_feedback_releases where activity_id = target_activity_id and student_id = caller_id order by created_at desc limit 1;
  select * into analysis_row from public.ai_analyses where activity_id = target_activity_id;
  if not exists (select 1 from public.student_submissions where activity_id = target_activity_id and student_id = caller_id and status = 'submitted') then
    return query select 'locked'::text, coalesce(analysis_row.attempt_count, 0), null::text, null::timestamptz, null::timestamptz, null::jsonb, null::jsonb, null::jsonb, null::jsonb, 'unavailable'::text; return;
  end if;
  return query select coalesce(release_row.status, case when analysis_row.status = 'failed' then 'failed' else 'pending_analysis' end),
    coalesce(analysis_row.attempt_count, 0), analysis_row.safe_error_code, analysis_row.attempted_at, analysis_row.completed_at,
    case when release_row.status = 'released' then analysis_row.probabilities else null end,
    case when release_row.status = 'released' then analysis_row.thresholds else null end,
    case when release_row.status = 'released' then analysis_row.findings else null end,
    case when release_row.status = 'released' then jsonb_build_object('releaseId', analysis_row.model_release_id_text, 'modelSha256', analysis_row.model_sha256, 'bundleSha256', analysis_row.bundle_sha256, 'manifestVersion', analysis_row.manifest_version, 'preprocessingVersion', analysis_row.preprocessing_version, 'thresholdVersion', analysis_row.threshold_version, 'executionProvider', analysis_row.execution_provider, 'applicationBuild', analysis_row.application_build) else null end,
    'unavailable'::text;
end;
$$;

create function public.get_professor_activity_ai_status(target_activity_id uuid)
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
    'unavailable'::text;
end;
$$;

revoke all on function private.guard_ai_analysis_mutation() from public, anon, authenticated;
revoke all on function private.guard_ai_feedback_release_mutation() from public, anon, authenticated;
revoke all on function private.sync_activity_ai_feedback(uuid) from public, anon, authenticated;
revoke all on function private.sync_submission_ai_feedback() from public, anon, authenticated;
revoke all on function public.claim_activity_ai_analysis(uuid) from public, anon;
revoke all on function public.complete_activity_ai_analysis(uuid,uuid,jsonb,jsonb,text,text) from public, anon;
revoke all on function public.fail_activity_ai_analysis(uuid,uuid,text) from public, anon;
revoke all on function public.get_student_activity_ai_feedback(uuid) from public, anon;
revoke all on function public.get_professor_activity_ai_status(uuid) from public, anon;
grant execute on function public.claim_activity_ai_analysis(uuid) to authenticated;
grant execute on function public.complete_activity_ai_analysis(uuid,uuid,jsonb,jsonb,text,text) to authenticated;
grant execute on function public.fail_activity_ai_analysis(uuid,uuid,text) to authenticated;
grant execute on function public.get_student_activity_ai_feedback(uuid) to authenticated;
grant execute on function public.get_professor_activity_ai_status(uuid) to authenticated;
