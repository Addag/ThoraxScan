-- Lets a signed-in user prove their current password before changing it.
-- Captcha guards signInWithPassword, so re-authenticating there is not an option.
-- ponytail: no per-user attempt limit; it needs a live session already. Add a
-- throttle table if repeated guessing ever shows up.
create function public.verify_own_password(current_password text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as account
    where account.id = (select auth.uid())
      and account.encrypted_password is not null
      and account.encrypted_password <> ''
      and account.encrypted_password = extensions.crypt(
        coalesce(current_password, ''),
        account.encrypted_password
      )
  );
$$;

revoke all on function public.verify_own_password(text) from public, anon;
grant execute on function public.verify_own_password(text) to authenticated;
