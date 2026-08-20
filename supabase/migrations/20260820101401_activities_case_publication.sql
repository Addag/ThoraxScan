create table public.xray_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  storage_path text not null unique,
  uploaded_by uuid not null references auth.users (id) on delete restrict,
  view_position text not null default 'frontal',
  mime_type text not null,
  byte_size bigint not null,
  upload_status text not null default 'pending',
  attested_by uuid not null references auth.users (id) on delete restrict,
  attested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xray_cases_id_workspace_unique unique (id, workspace_id),
  constraint xray_cases_generated_path check (
    storage_path = workspace_id::text || '/' || id::text
  ),
  constraint xray_cases_view_position_frontal check (view_position = 'frontal'),
  constraint xray_cases_mime_type_allowed check (
    mime_type in ('image/jpeg', 'image/png')
  ),
  constraint xray_cases_byte_size_allowed check (
    byte_size between 1 and 6291456
  ),
  constraint xray_cases_upload_status_valid check (
    upload_status in ('pending', 'ready', 'failed')
  ),
  constraint xray_cases_attestation_actor check (attested_by = uploaded_by)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  instructions text not null,
  due_at timestamptz,
  status text not null default 'draft',
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_case_workspace_fk
    foreign key (case_id, workspace_id)
    references public.xray_cases (id, workspace_id)
    on delete restrict,
  constraint activities_title_valid check (
    title = btrim(title)
    and char_length(title) between 3 and 100
  ),
  constraint activities_instructions_valid check (
    instructions = btrim(instructions)
    and char_length(instructions) between 10 and 5000
  ),
  constraint activities_status_valid check (
    status in ('draft', 'published', 'archived')
  ),
  constraint activities_lifecycle_dates_valid check (
    (status = 'draft' and published_at is null and archived_at is null)
    or (status = 'published' and published_at is not null and archived_at is null)
    or (status = 'archived' and published_at is not null and archived_at is not null)
  ),
  constraint activities_published_case_required check (
    status = 'draft' or case_id is not null
  )
);

create unique index activities_case_id_unique
  on public.activities (case_id)
  where case_id is not null;

create table public.activity_reference_evaluations (
  activity_id uuid primary key references public.activities (id) on delete cascade,
  evaluation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_reference_evaluation_valid check (
    evaluation = btrim(evaluation)
    and char_length(evaluation) <= 5000
  )
);

create index xray_cases_workspace_id_idx
  on public.xray_cases (workspace_id);
create index xray_cases_uploaded_by_idx
  on public.xray_cases (uploaded_by);
create index xray_cases_attested_by_idx
  on public.xray_cases (attested_by);
create index xray_cases_workspace_upload_status_idx
  on public.xray_cases (workspace_id, upload_status);
create index activities_workspace_id_idx
  on public.activities (workspace_id);
create index activities_created_by_idx
  on public.activities (created_by);
create index activities_workspace_status_created_idx
  on public.activities (workspace_id, status, created_at desc);
create index activities_student_feed_idx
  on public.activities (published_at desc)
  where status = 'published';

create function private.validate_xray_case_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id
      or new.workspace_id <> old.workspace_id
      or new.storage_path <> old.storage_path
      or new.uploaded_by <> old.uploaded_by
      or new.attested_by <> old.attested_by
      or new.attested_at <> old.attested_at
      or new.view_position <> old.view_position then
      raise exception using errcode = '42501', message = 'case identity and attestation are immutable';
    end if;

    if old.upload_status = 'ready'
      and (
        new.mime_type <> old.mime_type
        or new.byte_size <> old.byte_size
        or new.upload_status <> old.upload_status
      ) then
      raise exception using errcode = '42501', message = 'ready case metadata is immutable';
    end if;
  end if;

  if exists (
    select 1
    from public.activities as activity
    where activity.case_id = old.id
      and activity.status in ('published', 'archived')
  ) then
    raise exception using errcode = '42501', message = 'published case is immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create function private.validate_activity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  case_is_ready boolean;
  reference_is_ready boolean;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft'
      or new.published_at is not null
      or new.archived_at is not null then
      raise exception using errcode = '23514', message = 'activities must begin as drafts';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception using errcode = '42501', message = 'published activities cannot be deleted';
    end if;
    return old;
  end if;

  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'activity identity is immutable';
  end if;

  if old.status = 'draft' and new.status not in ('draft', 'published') then
    raise exception using errcode = '23514', message = 'invalid activity status transition';
  elsif old.status = 'published' and new.status not in ('published', 'archived') then
    raise exception using errcode = '23514', message = 'invalid activity status transition';
  elsif old.status = 'archived' then
    raise exception using errcode = '42501', message = 'archived activities are immutable';
  end if;

  if old.status in ('published', 'archived') and new.case_id is distinct from old.case_id then
    raise exception using errcode = '42501', message = 'published activity cases are immutable';
  end if;

  if old.status = 'draft' and new.status = 'published' then
    select exists (
      select 1
      from public.xray_cases as xray_case
      where xray_case.id = new.case_id
        and xray_case.workspace_id = new.workspace_id
        and xray_case.upload_status = 'ready'
        and xray_case.attested_at is not null
        and xray_case.view_position = 'frontal'
        and xray_case.mime_type in ('image/jpeg', 'image/png')
        and xray_case.byte_size between 1 and 6291456
    ) into case_is_ready;

    select exists (
      select 1
      from public.activity_reference_evaluations as reference
      where reference.activity_id = new.id
        and char_length(reference.evaluation) between 1 and 5000
    ) into reference_is_ready;

    if not case_is_ready then
      raise exception using errcode = '23514', message = 'a ready frontal X-ray case is required';
    end if;

    if not reference_is_ready then
      raise exception using errcode = '23514', message = 'a reference evaluation is required';
    end if;

    if new.due_at is not null and new.due_at <= now() then
      raise exception using errcode = '23514', message = 'due date must be in the future when published';
    end if;

    new.published_at = now();
    new.archived_at = null;
  elsif old.status = 'published' and new.status = 'archived' then
    new.published_at = old.published_at;
    new.archived_at = now();
  else
    new.published_at = old.published_at;
    new.archived_at = old.archived_at;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create function private.validate_reference_evaluation_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_status text;
begin
  select activity.status
  into activity_status
  from public.activities as activity
  where activity.id = coalesce(new.activity_id, old.activity_id);

  if activity_status = 'archived' then
    raise exception using errcode = '42501', message = 'archived reference evaluations are immutable';
  end if;

  if tg_op = 'UPDATE' then
    if new.activity_id <> old.activity_id then
      raise exception using errcode = '42501', message = 'reference evaluation identity is immutable';
    end if;
    new.updated_at = now();
  end if;

  return new;
end;
$$;

create function private.can_read_activity_case_object(target_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.xray_cases as xray_case
      where xray_case.storage_path = target_name
        and (
          (select private.is_workspace_professor(xray_case.workspace_id))
          or (
            (select private.current_profile_role()) = 'student'
            and (select private.is_workspace_member(xray_case.workspace_id))
            and exists (
              select 1
              from public.activities as activity
              where activity.case_id = xray_case.id
                and activity.workspace_id = xray_case.workspace_id
                and activity.status = 'published'
            )
          )
        )
    );
$$;

create function public.confirm_activity_case_upload(target_case_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  xray_case public.xray_cases%rowtype;
  object_metadata jsonb;
  object_mime_type text;
  object_byte_size bigint;
begin
  if caller_id is null or target_case_id is null then
    return 'unauthorized';
  end if;

  select candidate.*
  into xray_case
  from public.xray_cases as candidate
  where candidate.id = target_case_id
  for update;

  if not found
    or xray_case.upload_status <> 'pending'
    or not (select private.is_workspace_professor(xray_case.workspace_id)) then
    return 'unauthorized';
  end if;

  select object.metadata
  into object_metadata
  from storage.objects as object
  where object.bucket_id = 'activity-cases'
    and object.name = xray_case.storage_path;

  if not found or object_metadata is null then
    return 'missing_object';
  end if;

  object_mime_type := object_metadata ->> 'mimetype';
  if coalesce(object_metadata ->> 'size', '') ~ '^[0-9]+$' then
    object_byte_size := (object_metadata ->> 'size')::bigint;
  end if;

  if object_mime_type is distinct from xray_case.mime_type
    or object_byte_size is distinct from xray_case.byte_size
    or object_mime_type not in ('image/jpeg', 'image/png')
    or object_byte_size not between 1 and 6291456 then
    update public.xray_cases as candidate
    set upload_status = 'failed'
    where candidate.id = xray_case.id;
    return 'invalid_object';
  end if;

  update public.xray_cases as candidate
  set upload_status = 'ready'
  where candidate.id = xray_case.id;

  return 'ready';
end;
$$;

create trigger xray_cases_validate_change
before update or delete on public.xray_cases
for each row execute function private.validate_xray_case_change();

create trigger activities_validate_change
before insert or update or delete on public.activities
for each row execute function private.validate_activity_change();

create trigger activity_reference_evaluations_validate_change
before insert or update on public.activity_reference_evaluations
for each row execute function private.validate_reference_evaluation_change();

alter table public.xray_cases enable row level security;
alter table public.activities enable row level security;
alter table public.activity_reference_evaluations enable row level security;

revoke all on table public.xray_cases from anon, authenticated;
revoke all on table public.activities from anon, authenticated;
revoke all on table public.activity_reference_evaluations from anon, authenticated;

grant select, insert, delete on table public.xray_cases to authenticated;
grant select, insert, update, delete on table public.activities to authenticated;
grant select, insert, update, delete on table public.activity_reference_evaluations to authenticated;
grant select, insert, update, delete on table public.xray_cases to service_role;
grant select, insert, update, delete on table public.activities to service_role;
grant select, insert, update, delete on table public.activity_reference_evaluations to service_role;

create policy "Teaching staff can read workspace cases"
on public.xray_cases
for select
to authenticated
using ((select private.is_workspace_professor(workspace_id)));

create policy "Teaching staff can reserve workspace cases"
on public.xray_cases
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and attested_by = (select auth.uid())
  and (select private.is_workspace_professor(workspace_id))
);

create policy "Teaching staff can delete unpublished cases"
on public.xray_cases
for delete
to authenticated
using (
  (select private.is_workspace_professor(workspace_id))
  and not exists (
    select 1
    from public.activities as activity
    where activity.case_id = xray_cases.id
      and activity.status in ('published', 'archived')
  )
);

create policy "Teaching staff can read workspace activities"
on public.activities
for select
to authenticated
using ((select private.is_workspace_professor(workspace_id)));

create policy "Students can read published joined activities"
on public.activities
for select
to authenticated
using (
  status = 'published'
  and (select private.current_profile_role()) = 'student'
  and (select private.is_workspace_member(workspace_id))
);

create policy "Teaching staff can create workspace activities"
on public.activities
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'draft'
  and (select private.is_workspace_professor(workspace_id))
);

create policy "Teaching staff can update workspace activities"
on public.activities
for update
to authenticated
using ((select private.is_workspace_professor(workspace_id)))
with check ((select private.is_workspace_professor(workspace_id)));

create policy "Teaching staff can delete draft activities"
on public.activities
for delete
to authenticated
using (
  status = 'draft'
  and (select private.is_workspace_professor(workspace_id))
);

create policy "Teaching staff can read reference evaluations"
on public.activity_reference_evaluations
for select
to authenticated
using (
  exists (
    select 1
    from public.activities as activity
    where activity.id = activity_reference_evaluations.activity_id
      and (select private.is_workspace_professor(activity.workspace_id))
  )
);

create policy "Teaching staff can create reference evaluations"
on public.activity_reference_evaluations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.activities as activity
    where activity.id = activity_reference_evaluations.activity_id
      and (select private.is_workspace_professor(activity.workspace_id))
  )
);

create policy "Teaching staff can update reference evaluations"
on public.activity_reference_evaluations
for update
to authenticated
using (
  exists (
    select 1
    from public.activities as activity
    where activity.id = activity_reference_evaluations.activity_id
      and (select private.is_workspace_professor(activity.workspace_id))
  )
)
with check (
  exists (
    select 1
    from public.activities as activity
    where activity.id = activity_reference_evaluations.activity_id
      and (select private.is_workspace_professor(activity.workspace_id))
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'activity-cases',
  'activity-cases',
  false,
  6291456,
  array['image/jpeg', 'image/png']
);

create policy "Authorized members can read activity case objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'activity-cases'
  and (select private.can_read_activity_case_object(name))
);

create policy "Teaching staff can upload reserved case objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'activity-cases'
  and exists (
    select 1
    from public.xray_cases as xray_case
    where xray_case.storage_path = name
      and xray_case.uploaded_by = (select auth.uid())
      and xray_case.upload_status = 'pending'
      and (select private.is_workspace_professor(xray_case.workspace_id))
  )
);

create policy "Teaching staff can delete unpublished case objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'activity-cases'
  and exists (
    select 1
    from public.xray_cases as xray_case
    where xray_case.storage_path = name
      and (select private.is_workspace_professor(xray_case.workspace_id))
      and not exists (
        select 1
        from public.activities as activity
        where activity.case_id = xray_case.id
          and activity.status in ('published', 'archived')
      )
  )
);

revoke all on function private.validate_xray_case_change() from public, anon, authenticated;
revoke all on function private.validate_activity_change() from public, anon, authenticated;
revoke all on function private.validate_reference_evaluation_change() from public, anon, authenticated;
revoke all on function private.can_read_activity_case_object(text) from public, anon;
grant execute on function private.can_read_activity_case_object(text) to authenticated;
revoke all on function public.confirm_activity_case_upload(uuid) from public, anon;
grant execute on function public.confirm_activity_case_upload(uuid) to authenticated;
