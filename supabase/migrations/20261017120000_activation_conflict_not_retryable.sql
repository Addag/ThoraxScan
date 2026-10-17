-- SQLSTATE 40001 makes PostgREST retry the transaction. A stale revision never succeeds on retry,
-- so one stale model:activate call looped forever and pinned hosted CPU. PT409 is not retried
-- and PostgREST returns it as HTTP 409 Conflict.
-- https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b
create or replace function public.activate_model_release(
  target_model_release_id bigint,
  expected_revision bigint,
  actor text,
  reason text
)
returns table (previous_model_release_id bigint, active_model_release_id bigint, revision bigint)
language plpgsql
set search_path = ''
as $$
declare
  current_slot public.model_slots%rowtype;
  next_revision bigint;
begin
  if actor is null or btrim(actor) = '' or reason is null or btrim(reason) = '' then
    raise exception using errcode = '22023', message = 'actor and reason are required';
  end if;
  select slot.* into current_slot from public.model_slots as slot
    where slot.slot = 'thoraxscan-classifier' for update;
  if current_slot.revision <> expected_revision then
    raise exception using errcode = 'PT409', message = 'model slot revision changed';
  end if;
  if target_model_release_id is not null and not exists (
    select 1 from public.model_releases as release
    where release.id = target_model_release_id and release.slot = current_slot.slot
  ) then
    raise exception using errcode = '22023', message = 'model release is unavailable';
  end if;
  if current_slot.active_model_release_id is not distinct from target_model_release_id then
    raise exception using errcode = '22023', message = 'model release is already active';
  end if;
  next_revision := current_slot.revision + 1;
  update public.model_slots as slot set active_model_release_id = target_model_release_id,
    revision = next_revision, activated_by = btrim(actor), activated_at = now()
    where slot.slot = current_slot.slot;
  insert into public.model_activation_events (slot, previous_model_release_id, active_model_release_id,
    revision, activated_by, reason)
  values (current_slot.slot, current_slot.active_model_release_id, target_model_release_id,
    next_revision, btrim(actor), btrim(reason));
  return query select current_slot.active_model_release_id, target_model_release_id, next_revision;
end;
$$;

