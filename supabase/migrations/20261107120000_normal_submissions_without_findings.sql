-- A Normal response is now a single choice: it carries no findings or region text.
-- Abnormal finals still need both. Existing rows stay valid because the check only loosens.
alter table public.student_submissions drop constraint student_submissions_final_fields;
alter table public.student_submissions add constraint student_submissions_final_fields check (
  status <> 'submitted' or (classification is not null
    and (classification <> 'abnormal' or (visible_findings <> '' and relevant_region <> '')))
);

create or replace function public.save_student_activity_submission(
  target_activity_id uuid, input_visible_findings text, input_classification text,
  input_relevant_region text, finalize boolean default false
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  activity public.activities%rowtype;
  existing public.student_submissions%rowtype;
  saved_at timestamptz;
  findings text := btrim(coalesce(input_visible_findings, ''), E' \t\n\r\f\v');
  category text := nullif(btrim(coalesce(input_classification, ''), E' \t\n\r\f\v'), '');
  region text := btrim(coalesce(input_relevant_region, ''), E' \t\n\r\f\v');
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
  -- Serialize this student/activity pair, including when no draft exists yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_activity_id::text || caller::text, 0));
  select * into existing from public.student_submissions
    where activity_id = target_activity_id and student_id = caller for update;
  if existing.status = 'submitted' then return 'already_submitted'; end if;
  saved_at := clock_timestamp();
  if activity.due_at is not null and saved_at >= activity.due_at then return 'deadline_passed'; end if;
  if category = 'normal' then findings := ''; region := ''; end if;
  -- Invalid RPC input maps to the stable unavailable result; the action supplies field errors.
  if finalize is null or char_length(findings) > 5000 or char_length(region) > 200
    or (category is not null and category not in ('normal', 'abnormal'))
    or (findings = '' and category is null and region = '')
    or (finalize and (category is null or (category = 'abnormal' and (findings = '' or region = ''))))
  then return 'unavailable'; end if;
  insert into public.student_submissions(activity_id, student_id, visible_findings, classification,
    relevant_region, status, created_at, updated_at, submitted_at)
  values (target_activity_id, caller, findings, category, region,
    case when finalize then 'submitted' else 'draft' end, saved_at, saved_at,
    case when finalize then saved_at end)
  on conflict (activity_id, student_id) do update set
    visible_findings = excluded.visible_findings, classification = excluded.classification,
    relevant_region = excluded.relevant_region, status = excluded.status,
    updated_at = excluded.updated_at, submitted_at = excluded.submitted_at;
  return case when finalize then 'submitted' else 'draft_saved' end;
end;
$$;
