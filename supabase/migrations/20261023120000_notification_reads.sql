-- Bell notifications are derived at read time (upcoming activity dues, new final submissions);
-- only the per-user "seen" marker is stored. ref_id is an activity id or a submission id per kind.
create table public.notification_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  ref_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (user_id, kind, ref_id),
  constraint notification_reads_kind_valid check (kind in ('activity_due', 'submission'))
);

alter table public.notification_reads enable row level security;

revoke all on table public.notification_reads from anon, authenticated;
grant select, insert on table public.notification_reads to authenticated;
grant select, insert, update, delete on table public.notification_reads to service_role;

create policy "Users can read their own notification reads"
on public.notification_reads
for select
to authenticated
using ((select auth.uid()) = user_id);

-- The subqueries run under the caller's own RLS, so only visible activities and submissions can be marked read.
create policy "Users can mark visible notifications read"
on public.notification_reads
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    (
      kind = 'activity_due'
      and exists (select 1 from public.activities as activity where activity.id = ref_id)
    )
    or (
      kind = 'submission'
      and exists (select 1 from public.student_submissions as submission where submission.id = ref_id)
    )
  )
);
