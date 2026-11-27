-- Optional two-step login with an authenticator app (Supabase TOTP factor).
-- Rule: an account that has a verified factor may only use the API with a
-- session that passed the second step (aal2). Accounts without one are unchanged.

create function private.two_step_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
    or not exists (
      select 1
      from auth.mfa_factors as factor
      where factor.user_id = (select auth.uid())
        and factor.status = 'verified'
    );
$$;

revoke all on function private.two_step_satisfied() from public, anon;
grant execute on function private.two_step_satisfied() to authenticated;

-- Runs before every Data API request, so it covers every table and every RPC.
create function public.require_two_step()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.two_step_satisfied() then
    -- The app matches this message to send the user to the code screen.
    raise exception 'two_step_required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.require_two_step() from public;
grant execute on function public.require_two_step() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.require_two_step';
notify pgrst, 'reload config';

-- Storage requests do not pass through the Data API hook.
create policy "Two-step login is satisfied"
on storage.objects
as restrictive
for all
to authenticated
using ((select private.two_step_satisfied()))
with check ((select private.two_step_satisfied()));

-- Lost phone: an administrator removes the factor so the password works alone again.
create function public.admin_reset_two_step(target_user_id uuid)
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

  delete from auth.mfa_factors as factor where factor.user_id = target_user_id;
  if not found then
    return 'no_two_step';
  end if;

  perform private.revoke_account_sessions(target_user_id);
  perform private.log_admin_action('Reset two-step login', private.account_label(target_user_id));
  return 'two_step_reset';
end;
$$;

revoke all on function public.admin_reset_two_step(uuid) from public, anon, authenticated;
grant execute on function public.admin_reset_two_step(uuid) to authenticated;
