-- Students explain each selected label in writing and mark where each finding is on a heatmap.
-- Answers are no longer scored automatically: the Professor's released grade is the grade.

-- An object of label -> trimmed, non-empty text of at most 2,000 characters, keyed only by selected labels.
create function private.valid_label_answers(answers jsonb, labels text[]) returns boolean language sql immutable set search_path = '' as $$
  select answers is not null and jsonb_typeof(answers) = 'object' and not exists (
    select 1 from jsonb_each(answers) as answer(label, value)
    where not (answer.label = any(coalesce(labels, '{}'))) or jsonb_typeof(answer.value) <> 'string'
      or answer.value #>> '{}' = '' or answer.value #>> '{}' <> btrim(answer.value #>> '{}', E' \t\n\r\f\v')
      or char_length(answer.value #>> '{}') > 2000
  );
$$;
-- Every selected finding ("No Finding" has no location) has at least one marked cell in its 14x14 slice.
create function private.heatmap_marks_labels(map jsonb, labels text[]) returns boolean language sql immutable set search_path = '' as $$
  select not exists (
    select 1 from unnest(coalesce(labels, '{}')) as label
    join unnest(private.answer_labels()) with ordinality as known(name, position) on known.name = label
    where label <> 'No Finding' and (map is null or not exists (
      select 1 from generate_series(0, 195) as cell
      where (map -> ((known.position::integer - 1) * 196 + cell))::text::numeric > 0
    ))
  );
$$;
revoke all on function private.valid_label_answers(jsonb, text[]) from public, anon;
revoke all on function private.heatmap_marks_labels(jsonb, text[]) from public, anon;
grant execute on function private.valid_label_answers(jsonb, text[]) to authenticated;
grant execute on function private.heatmap_marks_labels(jsonb, text[]) to authenticated;

alter table public.student_submissions drop constraint student_submissions_final_labels;
alter table public.student_submissions
  drop column label_score,
  add column label_answers jsonb not null default '{}',
  add column student_heatmap jsonb;
-- Not validated: finals written before label answers existed are immutable and keep their text answers.
alter table public.student_submissions add constraint student_submissions_label_answers_valid check (
  private.valid_label_answers(label_answers, selected_labels)
  and (student_heatmap is null or private.valid_normalized_vector(student_heatmap, 2744))
) not valid;
alter table public.student_submissions add constraint student_submissions_final_labels check (
  status <> 'submitted' or private.valid_answer_labels(selected_labels)
) not valid;

-- Lets a Student's form know whether a heatmap is required, without revealing the key itself.
-- Only a key built from per-finding maps (V3) has anything to compare a Student's map with.
create function public.activity_requires_student_heatmap(target_activity_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.activities activity
    join public.activity_reference_evaluations reference on reference.activity_id = activity.id
    where activity.id = target_activity_id and activity.status = 'published' and auth.uid() is not null
      and private.is_workspace_member(activity.workspace_id) and reference.validated_heatmap is not null
  );
$$;
revoke all on function public.activity_requires_student_heatmap(uuid) from public, anon;
grant execute on function public.activity_requires_student_heatmap(uuid) to authenticated;

drop function public.save_student_activity_submission(uuid, text[], boolean);
create function public.save_student_activity_submission(target_activity_id uuid, input_labels text[],
  input_answers jsonb, input_heatmap jsonb, finalize boolean default false)
returns text language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  activity public.activities%rowtype;
  existing public.student_submissions%rowtype;
  key_row public.activity_reference_evaluations%rowtype;
  labels text[];
  answers jsonb;
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
  -- Activities published before answer keys existed have nothing to compare answers with.
  select * into key_row from public.activity_reference_evaluations where activity_id = target_activity_id;
  if key_row.validated_labels is null then return 'unavailable'; end if;
  -- Serialize this student/activity pair, including when no draft exists yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_activity_id::text || caller::text, 0));
  select * into existing from public.student_submissions
    where activity_id = target_activity_id and student_id = caller for update;
  if existing.status = 'submitted' then return 'already_submitted'; end if;
  saved_at := clock_timestamp();
  if activity.due_at is not null and saved_at >= activity.due_at then return 'deadline_passed'; end if;
  -- Invalid RPC input maps to the stable unavailable result; the action supplies field errors.
  if finalize is null or not private.valid_answer_labels(input_labels) is true
    or (input_answers is not null and jsonb_typeof(input_answers) <> 'object')
    or (input_heatmap is not null and not private.valid_normalized_vector(input_heatmap, 2744)) then return 'unavailable'; end if;
  labels := array(select label from unnest(private.answer_labels()) with ordinality as known(label, position)
    where label = any(input_labels) order by position);
  -- Keep answers for selected labels only, trimmed, and drop empty ones.
  answers := coalesce((select jsonb_object_agg(answer.label, btrim(answer.value #>> '{}', E' \t\n\r\f\v'))
    from jsonb_each(coalesce(input_answers, '{}')) as answer(label, value)
    where answer.label = any(labels) and jsonb_typeof(answer.value) = 'string'
      and btrim(answer.value #>> '{}', E' \t\n\r\f\v') <> ''), '{}');
  if not private.valid_label_answers(answers, labels) then return 'unavailable'; end if;
  if finalize and key_row.validated_heatmap is not null and not private.heatmap_marks_labels(input_heatmap, labels) then
    return 'heatmap_required';
  end if;
  -- classification is derived so class analytics keeps its normal/abnormal comparison.
  insert into public.student_submissions(activity_id, student_id, selected_labels, label_answers, student_heatmap, classification,
    visible_findings, relevant_region, status, created_at, updated_at, submitted_at)
  values (target_activity_id, caller, labels, answers, input_heatmap,
    case when labels = array['No Finding'] then 'normal' else 'abnormal' end, '', '',
    case when finalize then 'submitted' else 'draft' end, saved_at, saved_at,
    case when finalize then saved_at end)
  on conflict (activity_id, student_id) do update set
    selected_labels = excluded.selected_labels, label_answers = excluded.label_answers,
    student_heatmap = excluded.student_heatmap, classification = excluded.classification,
    visible_findings = '', relevant_region = '',
    status = excluded.status, updated_at = excluded.updated_at, submitted_at = excluded.submitted_at;
  return case when finalize then 'submitted' else 'draft_saved' end;
end;
$$;
revoke all on function public.save_student_activity_submission(uuid, text[], jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_student_activity_submission(uuid, text[], jsonb, jsonb, boolean) to authenticated;
