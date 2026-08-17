drop policy "Users can read their own profile" on public.profiles;
drop policy "Teaching staff can read member profiles" on public.profiles;

create policy "Users and teaching staff can read permitted profiles"
on public.profiles
for select
to authenticated
using ((select private.can_view_member_profile(id)));
