-- Live Results panel: when a Student's AI results are released (the analysis finished after they submitted),
-- send the same private "feedback_released" signal the bell listens for, so the open activity page re-renders.
-- Students cannot read ai_feedback_releases, so only the empty signal crosses; the page refetches through its RPC.
create function private.broadcast_results_release()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'released' and (tg_op = 'INSERT' or old.status is distinct from 'released') then
    perform realtime.send('{}'::jsonb, 'feedback_released', 'notifications:' || new.student_id::text, true);
  end if;
  return null;
end;
$$;

revoke all on function private.broadcast_results_release() from public, anon, authenticated;

create trigger ai_feedback_releases_broadcast_release
after insert or update of status on public.ai_feedback_releases
for each row execute function private.broadcast_results_release();
