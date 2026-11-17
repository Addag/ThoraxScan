-- Live notification bell.
-- Activities (due dates) and final submissions reach the bell through Postgres changes; Realtime applies
-- each table's existing RLS, so subscribers only hear about rows they can already read.
alter publication supabase_realtime add table public.activities, public.student_submissions;

-- Students cannot read faculty_evaluations (it holds private remarks), so a release is announced instead
-- as an empty private broadcast on the Student's own topic. The bell then refetches through the existing RPC.
create function private.broadcast_feedback_release()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'released' and (tg_op = 'INSERT' or old.status is distinct from 'released') then
    perform realtime.send(
      '{}'::jsonb,
      'feedback_released',
      'notifications:' || (select submission.student_id::text from public.student_submissions as submission where submission.id = new.submission_id),
      true
    );
  end if;
  return null;
end;
$$;

revoke all on function private.broadcast_feedback_release() from public, anon, authenticated;

create trigger faculty_evaluations_broadcast_release
after insert or update of status on public.faculty_evaluations
for each row execute function private.broadcast_feedback_release();

-- Each signed-in user may listen only on their own notifications topic.
create policy "Users receive their own notification broadcasts"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) = 'notifications:' || (select auth.uid())::text
);
