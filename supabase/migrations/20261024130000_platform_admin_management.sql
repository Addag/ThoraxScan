-- Lets administrators list, add, and remove other administrators from /admin.
-- The first administrator is still bootstrapped with the README statement.

-- Point reviewer and "added by" history at profiles, so removing someone's
-- administrator capability keeps their name on past reviews and grants.
alter table public.professor_applications
  drop constraint professor_applications_reviewed_by_fkey,
  add constraint professor_applications_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles (id) on delete set null;

alter table public.platform_admins
  drop constraint platform_admins_created_by_fkey,
  add constraint platform_admins_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null;

create function public.list_platform_admins()
returns table (
  user_id uuid,
  display_name text,
  email text,
  created_at timestamptz,
  created_by_name text
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
    administrator.user_id,
    profile.display_name,
    auth_user.email::text,
    administrator.created_at,
    creator.display_name
  from public.platform_admins as administrator
  join public.profiles as profile
    on profile.id = administrator.user_id
  join auth.users as auth_user
    on auth_user.id = administrator.user_id
  left join public.profiles as creator
    on creator.id = administrator.created_by
  order by administrator.created_at, profile.display_name;
end;
$$;

create function public.grant_platform_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_id uuid;
  email_is_confirmed boolean;
begin
  if caller_id is null or not (select private.is_platform_admin()) then
    return 'unauthorized';
  end if;

  select auth_user.id, auth_user.email_confirmed_at is not null
  into target_id, email_is_confirmed
  from auth.users as auth_user
  join public.profiles as profile
    on profile.id = auth_user.id
  where lower(auth_user.email) = lower(btrim(coalesce(target_email, '')));

  if target_id is null then
    return 'not_found';
  end if;

  if not email_is_confirmed then
    return 'email_unconfirmed';
  end if;

  insert into public.platform_admins (user_id, created_by)
  values (target_id, caller_id)
  on conflict (user_id) do nothing;

  if not found then
    return 'already_admin';
  end if;

  return 'granted';
end;
$$;

create function public.revoke_platform_admin(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then
    return 'unauthorized';
  end if;

  -- Locking the caller's own row means two administrators removing each other
  -- at once cannot both succeed: the second finds its row gone.
  perform 1
  from public.platform_admins as administrator
  where administrator.user_id = caller_id
  for share;

  if not found then
    return 'unauthorized';
  end if;

  -- Nobody can remove themselves, so at least one administrator always remains.
  if target_user_id = caller_id then
    return 'self';
  end if;

  delete from public.platform_admins as administrator
  where administrator.user_id = target_user_id;

  if not found then
    return 'not_found';
  end if;

  return 'revoked';
end;
$$;

revoke all on function public.list_platform_admins()
  from public, anon, authenticated;
revoke all on function public.grant_platform_admin(text)
  from public, anon, authenticated;
revoke all on function public.revoke_platform_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.list_platform_admins()
  to authenticated;
grant execute on function public.grant_platform_admin(text)
  to authenticated;
grant execute on function public.revoke_platform_admin(uuid)
  to authenticated;
