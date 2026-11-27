-- Administrator console: account management, site notices, platform analytics,
-- a platform activity feed, and a stored log of administrator actions.
-- Every function re-checks the caller's platform_admins row; nothing here needs a service key.

-- ---------------------------------------------------------------------------
-- Admin action log
-- ---------------------------------------------------------------------------

create table public.admin_actions (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  -- Names are snapshotted so the log still reads after an account is deleted.
  actor_name text not null,
  action text not null,
  target_label text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index admin_actions_created_at_idx on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;
revoke all on table public.admin_actions from anon, authenticated;
grant select, insert, update, delete on table public.admin_actions to service_role;

create function private.account_label(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select profile.display_name || ' <' || auth_user.email || '>'
      from public.profiles as profile
      join auth.users as auth_user on auth_user.id = profile.id
      where profile.id = target_user_id
    ),
    ''
  );
$$;

create function private.log_admin_action(action text, target_label text, detail text default '')
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_actions (actor_id, actor_name, action, target_label, detail)
  values (
    (select auth.uid()),
    coalesce(
      (select profile.display_name from public.profiles as profile where profile.id = (select auth.uid())),
      'Operator'
    ),
    action,
    coalesce(target_label, ''),
    coalesce(detail, '')
  );
$$;

-- Existing review and grant/revoke RPCs are logged by triggers, so they stay untouched.
create function private.log_professor_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.log_admin_action(
    case new.status
      when 'approved' then 'Approved Professor'
      when 'rejected' then 'Rejected Professor'
      else 'Changed Professor application'
    end,
    private.account_label(new.user_id),
    coalesce(new.rejection_reason, '')
  );
  return null;
end;
$$;

create trigger professor_applications_log_review
after update of status on public.professor_applications
for each row
when (old.status is distinct from new.status)
execute function private.log_professor_review();

create function private.log_platform_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Operator bootstrap (no session) and account deletion (already logged) are skipped.
  if (select auth.uid()) is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    perform private.log_admin_action('Added administrator', private.account_label(new.user_id));
  elsif exists (select 1 from public.profiles as profile where profile.id = old.user_id) then
    perform private.log_admin_action('Removed administrator', private.account_label(old.user_id));
  end if;

  return null;
end;
$$;

create trigger platform_admins_log_change
after insert or delete on public.platform_admins
for each row
execute function private.log_platform_admin_change();

-- Share-locks the caller's capability row (like revoke_platform_admin), so two
-- administrators cannot remove or disable each other at the same moment.
create function private.lock_admin_caller()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  perform 1
  from public.platform_admins as administrator
  where administrator.user_id = (select auth.uid())
  for share;

  return found;
end;
$$;

revoke all on function private.account_label(uuid) from public, anon, authenticated;
revoke all on function private.log_admin_action(text, text, text) from public, anon, authenticated;
revoke all on function private.log_professor_review() from public, anon, authenticated;
revoke all on function private.log_platform_admin_change() from public, anon, authenticated;
revoke all on function private.lock_admin_caller() from public, anon, authenticated;

create function public.list_admin_actions(max_rows integer default 50)
returns table (
  created_at timestamptz,
  actor_name text,
  action text,
  target_label text,
  detail text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_platform_admin()) then
    raise exception using errcode = '42501', message = 'administrator access required';
  end if;

  return query
  select entry.created_at, entry.actor_name, entry.action, entry.target_label, entry.detail
  from public.admin_actions as entry
  order by entry.created_at desc, entry.id desc
  limit least(greatest(coalesce(max_rows, 50), 1), 200);
end;
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create function public.list_accounts()
returns table (
  user_id uuid,
  display_name text,
  email text,
  role text,
  professor_status text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  disabled boolean,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_platform_admin()) then
    raise exception using errcode = '42501', message = 'administrator access required';
  end if;

  -- ponytail: returns every account; add paging if the platform grows past a few thousand users.
  return query
  select
    profile.id,
    profile.display_name,
    auth_user.email::text,
    profile.role,
    application.status,
    profile.created_at,
    auth_user.last_sign_in_at,
    coalesce(auth_user.banned_until > now(), false),
    exists (select 1 from public.platform_admins as administrator where administrator.user_id = profile.id)
  from public.profiles as profile
  join auth.users as auth_user on auth_user.id = profile.id
  left join public.professor_applications as application on application.user_id = profile.id
  order by profile.created_at desc;
end;
$$;

create function public.admin_rename_account(target_user_id uuid, new_display_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text := btrim(coalesce(new_display_name, ''));
  old_label text;
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  if char_length(normalized_name) not between 1 and 100 then
    return 'invalid_name';
  end if;

  old_label := private.account_label(target_user_id);

  update public.profiles as profile
  set display_name = normalized_name
  where profile.id = target_user_id;

  if not found then
    return 'not_found';
  end if;

  perform private.log_admin_action('Renamed account', old_label, 'New name: ' || normalized_name);
  return 'renamed';
end;
$$;

create function private.revoke_account_sessions(target_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.refresh_tokens where user_id = target_user_id::text;
  delete from auth.sessions where user_id = target_user_id;
$$;

revoke all on function private.revoke_account_sessions(uuid) from public, anon, authenticated;

create function public.admin_set_temporary_password(target_user_id uuid, new_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  if target_user_id = (select auth.uid()) then
    return 'self';
  end if;

  -- Same rules as the register and reset forms; 72 is the bcrypt input limit.
  if new_password is null
    or char_length(new_password) not between 8 and 72
    or new_password !~ '[A-Za-z]'
    or new_password !~ '[0-9]' then
    return 'invalid_password';
  end if;

  update auth.users as auth_user
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where auth_user.id = target_user_id;

  if not found then
    return 'not_found';
  end if;

  perform private.revoke_account_sessions(target_user_id);
  perform private.log_admin_action('Set temporary password', private.account_label(target_user_id));
  return 'password_set';
end;
$$;

create function public.admin_sign_out_account(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  if target_user_id = (select auth.uid()) then
    return 'self';
  end if;

  if not exists (select 1 from auth.users as auth_user where auth_user.id = target_user_id) then
    return 'not_found';
  end if;

  -- ponytail: access tokens already issued stay valid until they expire (1 hour by default).
  perform private.revoke_account_sessions(target_user_id);
  perform private.log_admin_action('Signed out everywhere', private.account_label(target_user_id));
  return 'signed_out';
end;
$$;

create function public.admin_set_account_disabled(target_user_id uuid, disable boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  if target_user_id = (select auth.uid()) then
    return 'self';
  end if;

  if disable is null then
    return 'invalid_request';
  end if;

  -- A far-future date rather than 'infinity', which the Auth server cannot read.
  update auth.users as auth_user
  set banned_until = case when disable then now() + interval '100 years' end,
      updated_at = now()
  where auth_user.id = target_user_id;

  if not found then
    return 'not_found';
  end if;

  if disable then
    perform private.revoke_account_sessions(target_user_id);
  end if;

  perform private.log_admin_action(
    case when disable then 'Disabled account' else 'Enabled account' end,
    private.account_label(target_user_id)
  );
  return case when disable then 'disabled' else 'enabled' end;
end;
$$;

create function public.admin_delete_account(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_label text;
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  if target_user_id = (select auth.uid()) then
    return 'self';
  end if;

  target_label := private.account_label(target_user_id);

  begin
    -- The profile, memberships, settings, consents, and capability rows cascade.
    -- Workspaces, activities, submissions, analyses, and evaluations restrict.
    delete from auth.users as auth_user where auth_user.id = target_user_id;
  exception
    when foreign_key_violation then
      return 'has_records';
  end;

  if not found then
    return 'not_found';
  end if;

  perform private.log_admin_action('Deleted account', target_label);
  return 'deleted';
end;
$$;

-- ---------------------------------------------------------------------------
-- Site-wide notices
-- ---------------------------------------------------------------------------

create table public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  tone text not null default 'info',
  ends_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint site_announcements_message_valid check (
    message = btrim(message) and char_length(message) between 1 and 300
  ),
  constraint site_announcements_tone_valid check (tone in ('info', 'warning'))
);

alter table public.site_announcements enable row level security;
revoke all on table public.site_announcements from anon, authenticated;
grant select on table public.site_announcements to anon, authenticated;
grant select, insert, update, delete on table public.site_announcements to service_role;

create policy "Everyone can read active site notices"
on public.site_announcements
for select
to anon, authenticated
using (ends_at is null or ends_at > now());

create function public.post_site_announcement(message text, tone text, ends_at timestamptz default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_message text := btrim(coalesce(message, ''));
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  if char_length(normalized_message) not between 1 and 300 then
    return 'invalid_message';
  end if;

  if tone is null or tone not in ('info', 'warning') then
    return 'invalid_tone';
  end if;

  if ends_at is not null and ends_at <= now() then
    return 'invalid_end';
  end if;

  insert into public.site_announcements (message, tone, ends_at, created_by)
  values (normalized_message, tone, ends_at, (select auth.uid()));

  perform private.log_admin_action('Posted notice', '', normalized_message);
  return 'posted';
end;
$$;

create function public.remove_site_announcement(target_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed_message text;
begin
  if not (select private.lock_admin_caller()) then
    return 'unauthorized';
  end if;

  delete from public.site_announcements as notice
  where notice.id = target_id
  returning notice.message into removed_message;

  if not found then
    return 'not_found';
  end if;

  perform private.log_admin_action('Removed notice', '', removed_message);
  return 'removed';
end;
$$;

-- ---------------------------------------------------------------------------
-- Analytics and activity feed
-- ---------------------------------------------------------------------------

create function public.get_platform_stats()
returns table (
  students bigint,
  professors_approved bigint,
  professors_pending bigint,
  administrators bigint,
  workspaces bigint,
  activities_published bigint,
  activities_draft bigint,
  final_submissions bigint,
  feedback_released bigint,
  new_accounts_30d bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_platform_admin()) then
    raise exception using errcode = '42501', message = 'administrator access required';
  end if;

  return query
  select
    (select count(*) from public.profiles as profile where profile.role = 'student'),
    (select count(*) from public.professor_applications as application where application.status = 'approved'),
    (select count(*) from public.professor_applications as application where application.status = 'pending'),
    (select count(*) from public.platform_admins),
    (select count(*) from public.workspaces),
    (select count(*) from public.activities as activity where activity.status = 'published'),
    (select count(*) from public.activities as activity where activity.status = 'draft'),
    (select count(*) from public.student_submissions as submission where submission.status = 'submitted'),
    (select count(*) from public.faculty_evaluations as evaluation where evaluation.status = 'released'),
    (select count(*) from public.profiles as profile where profile.created_at > now() - interval '30 days');
end;
$$;

create function public.list_professor_report()
returns table (
  user_id uuid,
  display_name text,
  email text,
  workspaces bigint,
  students bigint,
  activities bigint,
  final_submissions bigint,
  feedback_released bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_platform_admin()) then
    raise exception using errcode = '42501', message = 'administrator access required';
  end if;

  return query
  select
    profile.id,
    profile.display_name,
    auth_user.email::text,
    (select count(*) from public.workspaces as workspace where workspace.owner_id = profile.id),
    (
      select count(distinct member.user_id)
      from public.workspace_members as member
      join public.workspaces as workspace on workspace.id = member.workspace_id
      where workspace.owner_id = profile.id and member.role = 'student'
    ),
    (
      select count(*)
      from public.activities as activity
      join public.workspaces as workspace on workspace.id = activity.workspace_id
      where workspace.owner_id = profile.id and activity.status in ('published', 'archived')
    ),
    (
      select count(*)
      from public.student_submissions as submission
      join public.activities as activity on activity.id = submission.activity_id
      join public.workspaces as workspace on workspace.id = activity.workspace_id
      where workspace.owner_id = profile.id and submission.status = 'submitted'
    ),
    (
      select count(*)
      from public.faculty_evaluations as evaluation
      where evaluation.professor_id = profile.id and evaluation.status = 'released'
    )
  from public.profiles as profile
  join public.professor_applications as application
    on application.user_id = profile.id and application.status = 'approved'
  join auth.users as auth_user on auth_user.id = profile.id
  order by profile.display_name;
end;
$$;

create function public.list_platform_events(max_rows integer default 50)
returns table (at timestamptz, kind text, summary text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  row_limit integer := least(greatest(coalesce(max_rows, 50), 1), 200);
begin
  if (select auth.uid()) is null or not (select private.is_platform_admin()) then
    raise exception using errcode = '42501', message = 'administrator access required';
  end if;

  return query
  select event.at, event.kind, event.summary
  from (
    (
      select profile.created_at as at, 'account'::text as kind,
        profile.display_name || ' joined as ' || initcap(profile.role) as summary
      from public.profiles as profile
      order by profile.created_at desc
      limit row_limit
    )
    union all
    (
      select workspace.created_at, 'workspace',
        coalesce(owner.display_name, 'A Professor') || ' created workspace "' || workspace.name || '"'
      from public.workspaces as workspace
      left join public.profiles as owner on owner.id = workspace.owner_id
      order by workspace.created_at desc
      limit row_limit
    )
    union all
    (
      select activity.published_at, 'activity',
        '"' || activity.title || '" published in ' || workspace.name
      from public.activities as activity
      join public.workspaces as workspace on workspace.id = activity.workspace_id
      where activity.published_at is not null
      order by activity.published_at desc
      limit row_limit
    )
    union all
    (
      select submission.submitted_at, 'submission',
        coalesce(student.display_name, 'A Student') || ' submitted "' || activity.title || '"'
      from public.student_submissions as submission
      join public.activities as activity on activity.id = submission.activity_id
      left join public.profiles as student on student.id = submission.student_id
      where submission.status = 'submitted' and submission.submitted_at is not null
      order by submission.submitted_at desc
      limit row_limit
    )
    union all
    (
      select evaluation.released_at, 'feedback',
        coalesce(professor.display_name, 'A Professor') || ' released feedback on "' || activity.title || '"'
      from public.faculty_evaluations as evaluation
      join public.student_submissions as submission on submission.id = evaluation.submission_id
      join public.activities as activity on activity.id = submission.activity_id
      left join public.profiles as professor on professor.id = evaluation.professor_id
      where evaluation.status = 'released'
      order by evaluation.released_at desc
      limit row_limit
    )
  ) as event
  order by event.at desc
  limit row_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.list_admin_actions(integer) from public, anon, authenticated;
revoke all on function public.list_accounts() from public, anon, authenticated;
revoke all on function public.admin_rename_account(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_set_temporary_password(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_sign_out_account(uuid) from public, anon, authenticated;
revoke all on function public.admin_set_account_disabled(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_delete_account(uuid) from public, anon, authenticated;
revoke all on function public.post_site_announcement(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.remove_site_announcement(uuid) from public, anon, authenticated;
revoke all on function public.get_platform_stats() from public, anon, authenticated;
revoke all on function public.list_professor_report() from public, anon, authenticated;
revoke all on function public.list_platform_events(integer) from public, anon, authenticated;

grant execute on function public.list_admin_actions(integer) to authenticated;
grant execute on function public.list_accounts() to authenticated;
grant execute on function public.admin_rename_account(uuid, text) to authenticated;
grant execute on function public.admin_set_temporary_password(uuid, text) to authenticated;
grant execute on function public.admin_sign_out_account(uuid) to authenticated;
grant execute on function public.admin_set_account_disabled(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_account(uuid) to authenticated;
grant execute on function public.post_site_announcement(text, text, timestamptz) to authenticated;
grant execute on function public.remove_site_announcement(uuid) to authenticated;
grant execute on function public.get_platform_stats() to authenticated;
grant execute on function public.list_professor_report() to authenticated;
grant execute on function public.list_platform_events(integer) to authenticated;
