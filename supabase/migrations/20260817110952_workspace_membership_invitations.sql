create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_valid check (
    name = btrim(name)
    and char_length(name) between 3 and 100
  )
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint workspace_members_role_valid check (role in ('student', 'professor'))
);

create table public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  code_hash text not null unique,
  invited_role text not null,
  expires_at timestamptz not null,
  max_uses integer not null,
  uses_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_codes_hash_valid check (code_hash ~ '^[0-9a-f]{64}$'),
  constraint invitation_codes_role_valid check (invited_role in ('student', 'professor')),
  constraint invitation_codes_max_uses_valid check (
    (invited_role = 'student' and max_uses between 1 and 500)
    or (invited_role = 'professor' and max_uses = 1)
  ),
  constraint invitation_codes_uses_valid check (
    uses_count between 0 and max_uses
  ),
  constraint invitation_codes_expiry_valid check (expires_at > created_at)
);

create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_workspace_role_idx
  on public.workspace_members (workspace_id, role);
create index invitation_codes_workspace_id_idx
  on public.invitation_codes (workspace_id);
create index invitation_codes_created_by_idx
  on public.invitation_codes (created_by);
create index invitation_codes_active_workspace_idx
  on public.invitation_codes (workspace_id, invited_role)
  where is_active;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid());
$$;

create function private.is_workspace_member(target_workspace_id uuid)
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
  );
$$;

create function private.is_workspace_professor(target_workspace_id uuid)
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
  );
$$;

create function private.is_workspace_owner(target_workspace_id uuid)
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
  );
$$;

create function private.can_manage_invited_role(
  target_workspace_id uuid,
  target_role text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_role = 'professor'
      then (select private.is_workspace_owner(target_workspace_id))
    when target_role = 'student'
      then (select private.is_workspace_professor(target_workspace_id))
    else false
  end;
$$;

create function private.can_view_member_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.workspace_members as viewer
      join public.workspace_members as target
        on target.workspace_id = viewer.workspace_id
      where viewer.user_id = (select auth.uid())
        and viewer.role = 'professor'
        and target.user_id = target_user_id
    );
$$;

create function private.validate_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.owner_id <> old.owner_id then
    raise exception using errcode = '42501', message = 'workspace ownership cannot be transferred';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = new.owner_id
      and profile.role = 'professor'
  ) then
    raise exception using errcode = '23514', message = 'workspace owner must have a professor profile';
  end if;

  return new;
end;
$$;

create function private.add_workspace_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'professor');
  return new;
end;
$$;

create function private.validate_workspace_membership()
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

  if new.user_id = workspace_owner_id and new.role <> 'professor' then
    raise exception using errcode = '23514', message = 'workspace owner membership must be professor';
  end if;

  return new;
end;
$$;

create function private.protect_workspace_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.workspaces as workspace
    where workspace.id = old.workspace_id
      and workspace.owner_id = old.user_id
  ) then
    raise exception using errcode = '42501', message = 'workspace owner membership cannot be removed';
  end if;

  return old;
end;
$$;

create trigger workspaces_validate_owner
before insert or update of owner_id on public.workspaces
for each row execute function private.validate_workspace_owner();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger workspaces_add_owner_membership
after insert on public.workspaces
for each row execute function private.add_workspace_owner_membership();

create trigger workspace_members_validate_role
before insert or update on public.workspace_members
for each row execute function private.validate_workspace_membership();

create trigger workspace_members_protect_owner
before delete on public.workspace_members
for each row execute function private.protect_workspace_owner_membership();

create trigger invitation_codes_set_updated_at
before update on public.invitation_codes
for each row execute function private.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitation_codes enable row level security;

revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.invitation_codes from anon, authenticated;

grant select, insert, update (name) on table public.workspaces to authenticated;
grant select, delete on table public.workspace_members to authenticated;
grant select, insert, update (is_active) on table public.invitation_codes to authenticated;
grant select, insert, update, delete on table public.workspaces to service_role;
grant select, insert, update, delete on table public.workspace_members to service_role;
grant select, insert, update, delete on table public.invitation_codes to service_role;

grant usage on schema private to authenticated;
grant execute on function private.current_profile_role() to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_professor(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.can_manage_invited_role(uuid, text) to authenticated;
grant execute on function private.can_view_member_profile(uuid) to authenticated;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.validate_workspace_owner() from public, anon, authenticated;
revoke all on function private.add_workspace_owner_membership() from public, anon, authenticated;
revoke all on function private.validate_workspace_membership() from public, anon, authenticated;
revoke all on function private.protect_workspace_owner_membership() from public, anon, authenticated;

create policy "Members can read joined workspaces"
on public.workspaces
for select
to authenticated
using ((select private.is_workspace_member(id)));

create policy "Professors can create owned workspaces"
on public.workspaces
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and (select private.current_profile_role()) = 'professor'
);

create policy "Owners can rename workspaces"
on public.workspaces
for update
to authenticated
using ((select private.is_workspace_owner(id)))
with check ((select private.is_workspace_owner(id)));

create policy "Members can read permitted memberships"
on public.workspace_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_workspace_professor(workspace_id))
);

create policy "Teaching staff can remove members"
on public.workspace_members
for delete
to authenticated
using (
  (
    role = 'student'
    and (select private.is_workspace_professor(workspace_id))
  )
  or (
    role = 'professor'
    and user_id <> (select auth.uid())
    and (select private.is_workspace_owner(workspace_id))
  )
  or (
    role = 'professor'
    and user_id = (select auth.uid())
    and not (select private.is_workspace_owner(workspace_id))
  )
);

create policy "Teaching staff can read invitations"
on public.invitation_codes
for select
to authenticated
using ((select private.is_workspace_professor(workspace_id)));

create policy "Teaching staff can create permitted invitations"
on public.invitation_codes
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_invited_role(workspace_id, invited_role))
);

create policy "Teaching staff can revoke permitted invitations"
on public.invitation_codes
for update
to authenticated
using ((select private.can_manage_invited_role(workspace_id, invited_role)))
with check ((select private.can_manage_invited_role(workspace_id, invited_role)));

create policy "Teaching staff can read member profiles"
on public.profiles
for select
to authenticated
using ((select private.can_view_member_profile(id)));

create function public.redeem_workspace_invitation(code_hash text)
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

  select profile.role
  into caller_role
  from public.profiles as profile
  where profile.id = caller_id;

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

revoke all on function public.redeem_workspace_invitation(text) from public, anon;
grant execute on function public.redeem_workspace_invitation(text) to authenticated;
