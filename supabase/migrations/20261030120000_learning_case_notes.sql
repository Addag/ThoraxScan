-- Private Learning Mode notes: one per user and built-in library case (ids from src/lib/xray-library/cases.json).
-- Only the owner can read or write them; an empty note is stored as no row.
create table public.learning_case_notes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  case_id text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, case_id),
  constraint learning_case_notes_case_id_format check (case_id ~ '^[a-z0-9-]{1,40}$'),
  constraint learning_case_notes_body_length check (char_length(body) between 1 and 2000)
);

create trigger learning_case_notes_set_updated_at
before update on public.learning_case_notes
for each row execute function private.set_updated_at();

alter table public.learning_case_notes enable row level security;

revoke all on table public.learning_case_notes from anon, authenticated;
grant select, insert, update, delete on table public.learning_case_notes to authenticated;
grant select, insert, update, delete on table public.learning_case_notes to service_role;

create policy "Users can read their own learning notes"
on public.learning_case_notes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own learning notes"
on public.learning_case_notes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can edit their own learning notes"
on public.learning_case_notes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own learning notes"
on public.learning_case_notes
for delete
to authenticated
using ((select auth.uid()) = user_id);
