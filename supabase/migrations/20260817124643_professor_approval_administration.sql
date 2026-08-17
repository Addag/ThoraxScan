create table public.platform_admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_by uuid references public.platform_admins (user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.professor_applications (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.platform_admins (user_id) on delete set null,
  rejection_reason text,
  updated_at timestamptz not null default now(),
  constraint professor_applications_status_valid
    check (status in ('pending', 'approved', 'rejected')),
  constraint professor_applications_rejection_reason_valid check (
    rejection_reason is null
    or (
      rejection_reason = btrim(rejection_reason)
      and char_length(rejection_reason) between 1 and 500
    )
  ),
  constraint professor_applications_review_state_valid check (
    (
      status = 'pending'
      and reviewed_at is null
      and reviewed_by is null
      and rejection_reason is null
    )
    or (
      status = 'approved'
      and reviewed_at is not null
      and rejection_reason is null
    )
    or (
      status = 'rejected'
      and reviewed_at is not null
    )
  )
);

create index platform_admins_created_by_idx
  on public.platform_admins (created_by);
create index professor_applications_status_requested_idx
  on public.professor_applications (status, requested_at desc);
create index professor_applications_reviewed_by_idx
  on public.professor_applications (reviewed_by);

create trigger professor_applications_set_updated_at
before update on public.professor_applications
for each row execute function private.set_updated_at();

alter table public.platform_admins enable row level security;
alter table public.professor_applications enable row level security;

revoke all on table public.platform_admins from anon, authenticated;
revoke all on table public.professor_applications from anon, authenticated;
grant select on table public.platform_admins to authenticated;
grant select on table public.professor_applications to authenticated;
grant select, insert, update, delete on table public.platform_admins to service_role;
grant select, insert, update, delete on table public.professor_applications to service_role;

create policy "Users can read their own administrator capability"
on public.platform_admins
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Applicants can read their own Professor application"
on public.professor_applications
for select
to authenticated
using (user_id = (select auth.uid()));

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins as administrator
    where administrator.user_id = (select auth.uid())
  );
$$;

create function private.is_approved_professor(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.professor_applications as application
      on application.user_id = profile.id
    where profile.id = target_user_id
      and profile.role = 'professor'
      and application.status = 'approved'
  );
$$;

revoke all on function private.is_platform_admin()
  from public, anon, authenticated;
revoke all on function private.is_approved_professor(uuid)
  from public, anon, authenticated;

insert into public.professor_applications (
  user_id,
  status,
  requested_at,
  reviewed_at
)
select
  profile.id,
  'approved',
  profile.created_at,
  now()
from public.profiles as profile
where profile.role = 'professor'
on conflict (user_id) do nothing;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := case
    when new.raw_user_meta_data ->> 'requested_role' = 'professor'
      then 'professor'
    else 'student'
  end;
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')),
    requested_role
  );

  if requested_role = 'professor' then
    insert into public.professor_applications (user_id)
    values (new.id);
  end if;

  return new;
end;
$$;

create or replace function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when profile.role = 'student' then 'student'
    when profile.role = 'professor'
      and (select private.is_approved_professor(profile.id))
      then 'professor'
    else null
  end
  from public.profiles as profile
  where profile.id = (select auth.uid());
$$;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = target_workspace_id
      and member.user_id = (select auth.uid())
      and (
        member.role = 'student'
        or (
          member.role = 'professor'
          and (select private.is_approved_professor(member.user_id))
        )
      )
  );
$$;

create or replace function private.is_workspace_professor(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = target_workspace_id
      and member.user_id = (select auth.uid())
      and member.role = 'professor'
      and (select private.is_approved_professor(member.user_id))
  );
$$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces as workspace
    where workspace.id = target_workspace_id
      and workspace.owner_id = (select auth.uid())
      and (select private.is_approved_professor(workspace.owner_id))
  );
$$;

create or replace function private.can_view_member_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid())
    or (
      (select private.is_approved_professor((select auth.uid())))
      and exists (
        select 1
        from public.workspace_members as viewer
        join public.workspace_members as target
          on target.workspace_id = viewer.workspace_id
        where viewer.user_id = (select auth.uid())
          and viewer.role = 'professor'
          and target.user_id = target_user_id
      )
    );
$$;

create or replace function private.validate_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.owner_id <> old.owner_id then
    raise exception using errcode = '42501', message = 'workspace ownership cannot be transferred';
  end if;

  if not (select private.is_approved_professor(new.owner_id)) then
    raise exception using errcode = '23514', message = 'workspace owner must be an approved professor';
  end if;

  return new;
end;
$$;

create or replace function private.validate_workspace_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_owner_id uuid;
  profile_role text;
begin
  select workspace.owner_id
  into workspace_owner_id
  from public.workspaces as workspace
  where workspace.id = new.workspace_id;

  select profile.role
  into profile_role
  from public.profiles as profile
  where profile.id = new.user_id;

  if profile_role is null or profile_role <> new.role then
    raise exception using errcode = '23514', message = 'membership role must match the user profile';
  end if;

  if new.role = 'professor'
    and not (select private.is_approved_professor(new.user_id)) then
    raise exception using errcode = '23514', message = 'professor membership requires approval';
  end if;

  if new.user_id = workspace_owner_id and new.role <> 'professor' then
    raise exception using errcode = '23514', message = 'workspace owner membership must be professor';
  end if;

  return new;
end;
$$;

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
  order by
    case application.status
      when 'pending' then 0
      when 'rejected' then 1
      else 2
    end,
    application.requested_at desc;
end;
$$;

create function public.review_professor_application(
  target_user_id uuid,
  decision text,
  rejection_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_decision text := lower(btrim(coalesce(decision, '')));
  normalized_reason text := nullif(btrim(coalesce(rejection_reason, '')), '');
  application public.professor_applications%rowtype;
  email_is_confirmed boolean;
begin
  if caller_id is null or not (select private.is_platform_admin()) then
    return 'unauthorized';
  end if;

  if target_user_id is null
    or normalized_decision not in ('approve', 'reject') then
    return 'invalid_request';
  end if;

  if normalized_reason is not null
    and char_length(normalized_reason) > 500 then
    return 'reason_too_long';
  end if;

  select pending.*
  into application
  from public.professor_applications as pending
  where pending.user_id = target_user_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if normalized_decision = 'approve' then
    if application.status = 'approved' then
      return 'already_approved';
    end if;

    select auth_user.email_confirmed_at is not null
    into email_is_confirmed
    from auth.users as auth_user
    where auth_user.id = target_user_id;

    if not coalesce(email_is_confirmed, false) then
      return 'email_unconfirmed';
    end if;

    if exists (
      select 1
      from public.workspace_members as membership
      where membership.user_id = target_user_id
    ) then
      return 'has_memberships';
    end if;

    update public.professor_applications as approved
    set
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = caller_id,
      rejection_reason = null
    where approved.user_id = target_user_id;

    return 'approved';
  end if;

  if application.status = 'approved' then
    return 'invalid_state';
  end if;

  if application.status = 'rejected' then
    return 'already_rejected';
  end if;

  update public.professor_applications as rejected
  set
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = caller_id,
    rejection_reason = normalized_reason
  where rejected.user_id = target_user_id;

  return 'rejected';
end;
$$;

revoke all on function public.list_professor_applications()
  from public, anon, authenticated;
revoke all on function public.review_professor_application(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.list_professor_applications()
  to authenticated;
grant execute on function public.review_professor_application(uuid, text, text)
  to authenticated;

create or replace function public.redeem_workspace_invitation(code_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role text;
  invitation public.invitation_codes%rowtype;
begin
  if caller_id is null then
    return 'unauthorized';
  end if;

  select private.current_profile_role()
  into caller_role;

  if caller_role is null then
    return 'unauthorized';
  end if;

  if code_hash is null or code_hash !~ '^[0-9a-f]{64}$' then
    return 'invalid_code';
  end if;

  select code.*
  into invitation
  from public.invitation_codes as code
  where code.code_hash = redeem_workspace_invitation.code_hash
  for update;

  if not found then
    return 'invalid_code';
  end if;

  if invitation.invited_role <> caller_role then
    return 'unauthorized';
  end if;

  if exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = invitation.workspace_id
      and member.user_id = caller_id
  ) then
    return 'already_member';
  end if;

  if not invitation.is_active then
    return 'revoked_code';
  end if;

  if invitation.expires_at <= now() then
    return 'expired_code';
  end if;

  if invitation.uses_count >= invitation.max_uses then
    return 'exhausted_code';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (invitation.workspace_id, caller_id, caller_role);

  update public.invitation_codes as code
  set uses_count = code.uses_count + 1
  where code.id = invitation.id;

  return 'joined';
end;
$$;
