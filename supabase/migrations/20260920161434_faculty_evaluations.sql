create table public.faculty_evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.student_submissions(id) on delete restrict,
  professor_id uuid not null references public.profiles(id) on delete restrict,
  score numeric(5,2),
  remarks text not null default '',
  feedback text not null default '',
  status text not null default 'draft' check (status in ('draft', 'released')),
  released_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint faculty_evaluations_score_valid check (score >= 0 and score <= 100 and score = round(score, 2)),
  constraint faculty_evaluations_remarks_valid check (remarks = btrim(remarks, E' \t\n\r\f\v') and char_length(remarks) <= 5000),
  constraint faculty_evaluations_feedback_valid check (feedback = btrim(feedback, E' \t\n\r\f\v') and char_length(feedback) <= 5000),
  constraint faculty_evaluations_nonempty check (score is not null or remarks <> '' or feedback <> ''),
  constraint faculty_evaluations_lifecycle_valid check (updated_at >= created_at and (
    (status = 'draft' and released_at is null) or
    (status = 'released' and released_at = updated_at and released_at is not null and score is not null and feedback <> '')
  ))
);
create index faculty_evaluations_professor_id_idx on public.faculty_evaluations(professor_id);
create index faculty_evaluations_status_updated_at_idx on public.faculty_evaluations(status, updated_at desc);
create index student_submissions_submitted_at_idx on public.student_submissions(submitted_at desc, id) where status = 'submitted';

create function private.guard_faculty_evaluation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' or old.status = 'released' then
    raise exception using errcode = '42501', message = 'evaluation cannot be changed';
  end if;
  if new.id is distinct from old.id or new.submission_id is distinct from old.submission_id
    or new.professor_id is distinct from old.professor_id or new.created_at is distinct from old.created_at then
    raise exception using errcode = '42501', message = 'evaluation identity is immutable';
  end if;
  new.updated_at := clock_timestamp();
  new.released_at := case when new.status = 'released' then new.updated_at end;
  return new;
end;
$$;
revoke all on function private.guard_faculty_evaluation() from public, anon, authenticated;
create trigger faculty_evaluations_guard before update or delete on public.faculty_evaluations
for each row execute function private.guard_faculty_evaluation();
alter table public.faculty_evaluations enable row level security;
revoke all on public.faculty_evaluations from public, anon, authenticated;
grant select on public.faculty_evaluations to authenticated;
create policy "Approved workspace professors read evaluations" on public.faculty_evaluations
for select to authenticated using (exists (
  select 1 from public.student_submissions s join public.activities a on a.id = s.activity_id
  where s.id = faculty_evaluations.submission_id and s.status = 'submitted'
    and (select private.is_workspace_professor(a.workspace_id))
));

create function public.save_faculty_evaluation(
  target_submission_id uuid, input_score numeric, input_remarks text, input_feedback text,
  release_evaluation boolean default false
) returns text language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  submission public.student_submissions%rowtype;
  activity public.activities%rowtype;
  existing public.faculty_evaluations%rowtype;
  remarks_value text := btrim(coalesce(input_remarks, ''), E' \t\n\r\f\v');
  feedback_value text := btrim(coalesce(input_feedback, ''), E' \t\n\r\f\v');
  saved_at timestamptz;
begin
  if caller is null then return 'unauthorized'; end if;
  perform 1 from public.profiles where id = caller and role = 'professor' for share;
  if not found then return 'unauthorized'; end if;
  perform 1 from public.professor_applications where user_id = caller and status = 'approved' for share;
  if not found then return 'unauthorized'; end if;
  -- The immutable submission serializes writers even before an evaluation exists.
  select * into submission from public.student_submissions where id = target_submission_id for update;
  if not found or submission.status <> 'submitted' then return 'unavailable'; end if;
  select * into activity from public.activities where id = submission.activity_id for share;
  if not found then return 'unavailable'; end if;
  perform 1 from public.workspace_members where workspace_id = activity.workspace_id
    and user_id = caller and role = 'professor' for share;
  if not found or not private.is_workspace_professor(activity.workspace_id) then return 'unauthorized'; end if;
  select * into existing from public.faculty_evaluations where submission_id = target_submission_id for update;
  if existing.status = 'released' then return 'already_released'; end if;
  -- Validate the unconstrained numeric BEFORE numeric(5,2) can round input.
  if release_evaluation is null
    or (input_score is not null and (input_score < 0 or input_score > 100 or input_score <> round(input_score, 2)))
    or char_length(remarks_value) > 5000 or char_length(feedback_value) > 5000
    or (input_score is null and remarks_value = '' and feedback_value = '')
    or (release_evaluation and (input_score is null or feedback_value = ''))
  then return 'invalid_payload'; end if;
  saved_at := clock_timestamp();
  insert into public.faculty_evaluations(submission_id, professor_id, score, remarks, feedback, status, created_at, updated_at, released_at)
  values (target_submission_id, caller, input_score, remarks_value, feedback_value,
    case when release_evaluation then 'released' else 'draft' end, saved_at, saved_at,
    case when release_evaluation then saved_at end)
  on conflict (submission_id) do update set score = excluded.score, remarks = excluded.remarks,
    feedback = excluded.feedback, status = excluded.status;
  return case when release_evaluation then 'released' else 'draft_saved' end;
end;
$$;
revoke all on function public.save_faculty_evaluation(uuid,numeric,text,text,boolean) from public, anon;
grant execute on function public.save_faculty_evaluation(uuid,numeric,text,text,boolean) to authenticated;

create function public.get_student_activity_faculty_evaluation(target_activity_id uuid)
returns table(status text, score numeric, feedback text, released_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  submission_id_value uuid;
begin
  if caller is null or not exists (select 1 from public.profiles where id = caller and role = 'student')
    or not exists (select 1 from public.activities a join public.workspace_members m on m.workspace_id = a.workspace_id
      where a.id = target_activity_id and a.status = 'published' and m.user_id = caller and m.role = 'student')
  then return; end if;
  select s.id into submission_id_value from public.student_submissions s
    where s.activity_id = target_activity_id and s.student_id = caller and s.status = 'submitted';
  if submission_id_value is null then
    return query select 'locked'::text, null::numeric, null::text, null::timestamptz;
    return;
  end if;
  return query select 'released'::text, e.score, e.feedback, e.released_at
    from public.faculty_evaluations e where e.submission_id = submission_id_value and e.status = 'released';
  if not found then
    return query select 'awaiting_review'::text, null::numeric, null::text, null::timestamptz;
  end if;
end;
$$;
revoke all on function public.get_student_activity_faculty_evaluation(uuid) from public, anon;
grant execute on function public.get_student_activity_faculty_evaluation(uuid) to authenticated;
