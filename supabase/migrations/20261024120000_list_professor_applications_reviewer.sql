-- Adds the reviewer's display name so the administrator dashboard can show who
-- approved or rejected an application. The return type changes, so drop first.
drop function public.list_professor_applications();

create function public.list_professor_applications()
returns table (
  user_id uuid,
  display_name text,
  email text,
  email_confirmed boolean,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  reviewer_name text,
  rejection_reason text,
  membership_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not (select private.is_platform_admin()) then
    raise exception using errcode = '42501', message = 'administrator access required';
  end if;

  return query
  select
    application.user_id,
    profile.display_name,
    auth_user.email::text,
    auth_user.email_confirmed_at is not null,
    application.status,
    application.requested_at,
    application.reviewed_at,
    application.reviewed_by,
    reviewer.display_name,
    application.rejection_reason,
    (
      select count(*)
      from public.workspace_members as membership
      where membership.user_id = application.user_id
    )
  from public.professor_applications as application
  join public.profiles as profile
    on profile.id = application.user_id
  join auth.users as auth_user
    on auth_user.id = application.user_id
  left join public.profiles as reviewer
    on reviewer.id = application.reviewed_by
  order by
    case application.status
      when 'pending' then 0
      when 'rejected' then 1
      else 2
    end,
    application.requested_at desc;
end;
$$;

revoke all on function public.list_professor_applications()
  from public, anon, authenticated;
grant execute on function public.list_professor_applications()
  to authenticated;
