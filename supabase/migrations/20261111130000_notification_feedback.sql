-- Students get a bell item when a Professor releases feedback on their final submission.
-- ref_id for 'feedback' is the activity id: a Student has one submission per activity.

alter table public.notification_reads
  drop constraint notification_reads_kind_valid,
  add constraint notification_reads_kind_valid check (kind in ('activity_due', 'submission', 'feedback'));

drop policy "Users can mark visible notifications read" on public.notification_reads;

-- The subqueries run under the caller's own RLS, so only visible activities and submissions can be marked read.
create policy "Users can mark visible notifications read"
on public.notification_reads
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    (
      kind in ('activity_due', 'feedback')
      and exists (select 1 from public.activities as activity where activity.id = ref_id)
    )
    or (
      kind = 'submission'
      and exists (select 1 from public.student_submissions as submission where submission.id = ref_id)
    )
  )
);

-- faculty_evaluations RLS is Professor-only (it holds private remarks), so Students read release times here.
create function public.get_student_feedback_notifications(since timestamptz)
returns table (activity_id uuid, title text, workspace_name text, released_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select activity.id, activity.title, workspace.name, evaluation.released_at
  from public.student_submissions as submission
  join public.faculty_evaluations as evaluation
    on evaluation.submission_id = submission.id and evaluation.status = 'released'
  join public.activities as activity
    on activity.id = submission.activity_id and activity.status = 'published'
  join public.workspaces as workspace on workspace.id = activity.workspace_id
  join public.workspace_members as member
    on member.workspace_id = activity.workspace_id
    and member.user_id = submission.student_id
    and member.role = 'student'
  where submission.student_id = (select auth.uid())
    and submission.status = 'submitted'
    and evaluation.released_at >= coalesce(since, '-infinity'::timestamptz)
  order by evaluation.released_at desc
  limit 20;
$$;

revoke all on function public.get_student_feedback_notifications(timestamptz) from public, anon;
grant execute on function public.get_student_feedback_notifications(timestamptz) to authenticated;
