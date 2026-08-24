create table public.model_releases (
  id bigint generated always as identity primary key,
  slot text not null default 'thoraxscan-classifier',
  release_id text not null,
  contract_version smallint not null default 1,
  model_sha256 text not null,
  bundle_sha256 text not null,
  model_byte_size bigint not null,
  model_path text not null,
  manifest_path text not null,
  manifest jsonb not null,
  validation_summary jsonb not null,
  registered_by text not null,
  registered_at timestamptz not null default now(),
  constraint model_releases_slot_valid check (
    slot = 'thoraxscan-classifier'
  ),
  constraint model_releases_release_id_valid check (
    release_id = btrim(release_id)
    and release_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
  ),
  constraint model_releases_contract_version_valid check (
    contract_version = 1
  ),
  constraint model_releases_model_sha256_valid check (
    model_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint model_releases_bundle_sha256_valid check (
    bundle_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint model_releases_model_byte_size_valid check (
    model_byte_size between 1 and 52428800
  ),
  constraint model_releases_model_path_valid check (
    model_path = 'artifacts/sha256/' || model_sha256 || '/model.onnx'
  ),
  constraint model_releases_manifest_path_valid check (
    manifest_path = 'bundles/sha256/' || bundle_sha256 || '/manifest.json'
  ),
  constraint model_releases_manifest_valid check (
    jsonb_typeof(manifest) = 'object'
    and manifest ->> 'schemaVersion' = '1'
    and manifest #>> '{release,id}' = release_id
    and manifest #>> '{artifact,sha256}' = model_sha256
    and manifest #>> '{artifact,path}' = model_path
  ),
  constraint model_releases_validation_summary_valid check (
    jsonb_typeof(validation_summary) = 'object'
    and validation_summary @> '{"passed": true}'::jsonb
  ),
  constraint model_releases_registered_by_valid check (
    registered_by = btrim(registered_by)
    and char_length(registered_by) between 1 and 200
  ),
  constraint model_releases_slot_release_unique unique (slot, release_id),
  constraint model_releases_slot_bundle_unique unique (slot, bundle_sha256)
);

create table public.model_slots (
  slot text primary key,
  active_model_release_id bigint references public.model_releases (id) on delete restrict,
  revision bigint not null default 0,
  activated_by text,
  activated_at timestamptz,
  constraint model_slots_slot_valid check (
    slot = 'thoraxscan-classifier'
  ),
  constraint model_slots_revision_valid check (revision >= 0),
  constraint model_slots_activation_audit_valid check (
    (
      active_model_release_id is null
      and revision = 0
      and activated_by is null
      and activated_at is null
    )
    or (
      revision > 0
      and activated_by = btrim(activated_by)
      and char_length(activated_by) between 1 and 200
      and activated_at is not null
    )
  )
);

create index model_slots_active_model_release_id_idx
  on public.model_slots (active_model_release_id)
  where active_model_release_id is not null;

create table public.model_activation_events (
  id bigint generated always as identity primary key,
  slot text not null references public.model_slots (slot) on delete restrict,
  previous_model_release_id bigint references public.model_releases (id) on delete restrict,
  active_model_release_id bigint references public.model_releases (id) on delete restrict,
  revision bigint not null,
  activated_by text not null,
  reason text not null,
  activated_at timestamptz not null default now(),
  constraint model_activation_events_revision_valid check (revision > 0),
  constraint model_activation_events_actor_valid check (
    activated_by = btrim(activated_by)
    and char_length(activated_by) between 1 and 200
  ),
  constraint model_activation_events_reason_valid check (
    reason = btrim(reason)
    and char_length(reason) between 1 and 500
  ),
  constraint model_activation_events_revision_unique unique (slot, revision)
);

create index model_activation_events_previous_release_idx
  on public.model_activation_events (previous_model_release_id)
  where previous_model_release_id is not null;
create index model_activation_events_active_release_idx
  on public.model_activation_events (active_model_release_id);

insert into public.model_slots (slot)
values ('thoraxscan-classifier');

create function private.prevent_model_release_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = '42501',
    message = 'model releases and activation events are immutable';
end;
$$;

create trigger model_releases_prevent_mutation
before update or delete on public.model_releases
for each row execute function private.prevent_model_release_mutation();

create trigger model_activation_events_prevent_mutation
before update or delete on public.model_activation_events
for each row execute function private.prevent_model_release_mutation();

create function public.register_model_release(
  target_release_id text,
  target_model_sha256 text,
  target_bundle_sha256 text,
  target_model_byte_size bigint,
  target_model_path text,
  target_manifest_path text,
  target_manifest jsonb,
  target_validation_summary jsonb,
  actor text
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  existing_release public.model_releases%rowtype;
  registered_release_id bigint;
begin
  select release.*
  into existing_release
  from public.model_releases as release
  where release.slot = 'thoraxscan-classifier'
    and release.release_id = target_release_id;

  if found then
    if existing_release.bundle_sha256 = target_bundle_sha256
      and existing_release.model_sha256 = target_model_sha256
      and existing_release.manifest = target_manifest then
      return existing_release.id;
    end if;

    raise exception using
      errcode = '23505',
      message = 'release id is already registered with different content';
  end if;

  insert into public.model_releases (
    release_id,
    model_sha256,
    bundle_sha256,
    model_byte_size,
    model_path,
    manifest_path,
    manifest,
    validation_summary,
    registered_by
  ) values (
    target_release_id,
    target_model_sha256,
    target_bundle_sha256,
    target_model_byte_size,
    target_model_path,
    target_manifest_path,
    target_manifest,
    target_validation_summary,
    actor
  )
  returning id into registered_release_id;

  return registered_release_id;
end;
$$;

create function public.activate_model_release(
  target_model_release_id bigint,
  expected_revision bigint,
  actor text,
  reason text
)
returns table (
  previous_model_release_id bigint,
  active_model_release_id bigint,
  revision bigint
)
language plpgsql
set search_path = ''
as $$
declare
  current_slot public.model_slots%rowtype;
  target_release public.model_releases%rowtype;
  next_revision bigint;
begin
  if actor is null or btrim(actor) = ''
    or reason is null or btrim(reason) = '' then
    raise exception using errcode = '22023', message = 'actor and reason are required';
  end if;

  select slot.*
  into current_slot
  from public.model_slots as slot
  where slot.slot = 'thoraxscan-classifier'
  for update;

  if current_slot.revision <> expected_revision then
    raise exception using errcode = '40001', message = 'model slot revision changed';
  end if;

  if target_model_release_id is not null then
    select release.*
    into target_release
    from public.model_releases as release
    where release.id = target_model_release_id
      and release.slot = current_slot.slot;

    if not found then
      raise exception using errcode = '22023', message = 'model release is unavailable';
    end if;
  end if;

  if current_slot.active_model_release_id is not distinct from target_model_release_id then
    raise exception using errcode = '22023', message = 'model release is already active';
  end if;

  next_revision := current_slot.revision + 1;

  update public.model_slots as slot
  set active_model_release_id = target_model_release_id,
      revision = next_revision,
      activated_by = btrim(actor),
      activated_at = now()
  where slot.slot = current_slot.slot;

  insert into public.model_activation_events (
    slot,
    previous_model_release_id,
    active_model_release_id,
    revision,
    activated_by,
    reason
  ) values (
    current_slot.slot,
    current_slot.active_model_release_id,
    target_model_release_id,
    next_revision,
    btrim(actor),
    btrim(reason)
  );

  return query
  select
    current_slot.active_model_release_id,
    target_model_release_id,
    next_revision;
end;
$$;

create function public.get_active_model_release()
returns table (
  model_release_id bigint,
  release_id text,
  bundle_sha256 text,
  manifest_path text,
  manifest jsonb,
  revision bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;

  return query
  select
    release.id,
    release.release_id,
    release.bundle_sha256,
    release.manifest_path,
    release.manifest,
    slot.revision
  from public.model_slots as slot
  join public.model_releases as release
    on release.id = slot.active_model_release_id
  where slot.slot = 'thoraxscan-classifier';
end;
$$;

alter table public.model_releases enable row level security;
alter table public.model_slots enable row level security;
alter table public.model_activation_events enable row level security;

revoke all on table public.model_releases from anon, authenticated;
revoke all on table public.model_slots from anon, authenticated;
revoke all on table public.model_activation_events from anon, authenticated;
grant select, insert on table public.model_releases to service_role;
grant select, update on table public.model_slots to service_role;
grant select, insert on table public.model_activation_events to service_role;
grant usage, select on sequence public.model_releases_id_seq to service_role;
grant usage, select on sequence public.model_activation_events_id_seq to service_role;

revoke all on function private.prevent_model_release_mutation() from public, anon, authenticated, service_role;
revoke all on function public.register_model_release(text, text, text, bigint, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.register_model_release(text, text, text, bigint, text, text, jsonb, jsonb, text)
  to service_role;
revoke all on function public.activate_model_release(bigint, bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.activate_model_release(bigint, bigint, text, text)
  to service_role;
revoke all on function public.get_active_model_release() from public, anon;
grant execute on function public.get_active_model_release() to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'model-artifacts',
  'model-artifacts',
  true,
  52428800,
  array['application/json', 'application/octet-stream']
);
