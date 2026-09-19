create table public.student_submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  visible_findings text not null default '',
  classification text,
  relevant_region text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  submitted_at timestamptz,
  constraint student_submissions_activity_student_key unique (activity_id, student_id),
  constraint student_submissions_status_valid check (status in ('draft', 'submitted')),
  constraint student_submissions_classification_valid check (classification in ('normal', 'abnormal')),
  constraint student_submissions_findings_valid check (
    visible_findings = btrim(visible_findings, E' \t\n\r\f\v') and char_length(visible_findings) <= 5000
  ),
  constraint student_submissions_region_valid check (
    relevant_region = btrim(relevant_region, E' \t\n\r\f\v') and char_length(relevant_region) <= 200
    and (classification is distinct from 'normal' or relevant_region = '')
  ),
  constraint student_submissions_nonempty check (visible_findings <> '' or classification is not null or relevant_region <> ''),
  constraint student_submissions_final_fields check (
    status <> 'submitted' or (visible_findings <> '' and classification is not null
      and (classification <> 'abnormal' or relevant_region <> ''))
  ),
  constraint student_submissions_lifecycle_valid check (
    updated_at >= created_at and (
      (status = 'draft' and submitted_at is null) or
      (status = 'submitted' and submitted_at is not null and submitted_at = updated_at)
    )
  )
);
create index student_submissions_student_id_idx on public.student_submissions(student_id);
create function private.guard_student_submission() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status = 'submitted' or tg_op = 'DELETE' then
    raise exception using errcode = '42501', message = 'submission cannot be changed';
  end if;
  if new.id <> old.id or new.activity_id <> old.activity_id or new.student_id <> old.student_id
    or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'submission identity is immutable';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_student_submission() from public, anon, authenticated;
create trigger student_submissions_guard before update or delete on public.student_submissions
for each row execute function private.guard_student_submission();
alter table public.student_submissions enable row level security;
revoke all on public.student_submissions from public, anon, authenticated;
grant select on public.student_submissions to authenticated;

create policy "Students read own responses and professors read finals"
on public.student_submissions for select to authenticated using (
  exists (select 1 from public.activities a where a.id = student_submissions.activity_id and (
    (student_submissions.student_id = (select auth.uid()) and (select private.current_profile_role()) = 'student'
      and (select private.is_workspace_member(a.workspace_id)))
    or (student_submissions.status = 'submitted' and (select private.is_workspace_professor(a.workspace_id)))
  ))
);

create function public.save_student_activity_submission(
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
  if category = 'normal' then region := ''; end if;
  -- Invalid RPC input maps to the stable unavailable result; the action supplies field errors.
  if finalize is null or char_length(findings) > 5000 or char_length(region) > 200
    or (category is not null and category not in ('normal', 'abnormal'))
    or (findings = '' and category is null and region = '')
    or (finalize and (findings = '' or category is null or (category = 'abnormal' and region = '')))
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
revoke all on function public.save_student_activity_submission(uuid,text,text,text,boolean) from public, anon;
grant execute on function public.save_student_activity_submission(uuid,text,text,text,boolean) to authenticated;
