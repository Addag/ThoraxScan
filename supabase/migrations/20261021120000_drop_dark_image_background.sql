drop function public.update_own_account_settings(text, text, boolean);

create function public.update_own_account_settings(
  new_display_name text,
  new_work_phone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role text;
  normalized_display_name text := btrim(coalesce(new_display_name, ''));
  normalized_work_phone text := nullif(btrim(coalesce(new_work_phone, '')), '');
begin
  if caller_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if char_length(normalized_display_name) not between 1 and 100 then
    raise exception using
      errcode = '22023',
      message = 'display name must contain between 1 and 100 characters';
  end if;

  if normalized_work_phone is not null and (
    char_length(normalized_work_phone) not between 7 and 32
    or normalized_work_phone !~ '^[0-9+() .-]+$'
  ) then
    raise exception using
      errcode = '22023',
      message = 'work phone must contain 7 to 32 phone-like characters';
  end if;

  select profile.role
  into caller_role
  from public.profiles as profile
  where profile.id = caller_id;

  if caller_role is null then
    raise exception using
      errcode = '42501',
      message = 'profile unavailable';
  end if;

  if caller_role = 'student' and normalized_work_phone is not null then
    raise exception using
      errcode = '22023',
      message = 'work phone is available only to professor accounts';
  end if;

  update public.profiles as profile
  set
    display_name = normalized_display_name,
    updated_at = now()
  where profile.id = caller_id;

  insert into public.account_settings (
    profile_id,
    work_phone
  )
  values (
    caller_id,
    normalized_work_phone
  )
  on conflict (profile_id) do update
  set
    work_phone = excluded.work_phone;
end;
$$;

revoke all on function public.update_own_account_settings(text, text)
  from public, anon;
grant execute on function public.update_own_account_settings(text, text)
  to authenticated;

alter table public.account_settings drop column dark_image_background;
