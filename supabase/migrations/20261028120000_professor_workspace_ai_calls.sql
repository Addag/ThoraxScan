-- Class analytics: one normal/abnormal AI call per ready activity analysis.
-- Only the derived call leaves the database; probabilities stay private.
-- An empty findings array means no label crossed its threshold, so it is no call.
create function public.get_professor_workspace_ai_calls(target_workspace_id uuid)
returns table (activity_id uuid, ai_call text)
language sql stable security definer set search_path = '' as $$
  select a.activity_id,
    case when exists (select 1 from jsonb_array_elements(a.findings) f where f->>'label' <> 'No Finding')
      then 'abnormal' else 'normal' end
  from public.ai_analyses a join public.activities activity on activity.id = a.activity_id
  where auth.uid() is not null and activity.workspace_id = target_workspace_id
    and private.is_workspace_professor(activity.workspace_id)
    and a.status = 'ready' and jsonb_array_length(a.findings) > 0;
$$;
revoke all on function public.get_professor_workspace_ai_calls(uuid) from public, anon;
grant execute on function public.get_professor_workspace_ai_calls(uuid) to authenticated;
