-- Activity AI inference runs in the caller's browser, so whoever holds the claim chooses the stored result.
-- Only workspace Professors may claim now; Students could otherwise forge the feedback their classmates see.
-- complete_ and fail_activity_ai_analysis are unchanged: both require claimed_by = caller, and this is the only way to become it.
-- The submitted-submission check is gone so the Professor's browser can run the analysis at publish;
-- Students still read results only after submitting, through ai_feedback_releases.
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

-- Leases held when this runs may belong to Students; expire them so they cannot complete.
update public.ai_analyses set claim_expires_at = now() where status = 'pending';
