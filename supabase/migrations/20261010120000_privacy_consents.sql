-- Versioned privacy-notice and research-consent records.
-- Registration metadata is copied into this table after email confirmation,
-- when auth.uid() is available. The policy version is intentionally explicit
-- so a future policy revision creates a new consent record.

create table public.legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  document_version text not null,
  age_band text not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  constraint legal_consents_type_valid check (consent_type in ('privacy_notice', 'research_participation')),
  constraint legal_consents_version_valid check (document_version = btrim(document_version) and char_length(document_version) between 1 and 32),
  constraint legal_consents_age_band_valid check (age_band in ('adult', 'minor')),
  constraint legal_consents_withdrawal_valid check (withdrawn_at is null or withdrawn_at >= accepted_at)
);

create index legal_consents_user_type_idx on public.legal_consents(user_id, consent_type, accepted_at desc);

alter table public.legal_consents enable row level security;
revoke all on public.legal_consents from public, anon, authenticated;
grant select on public.legal_consents to authenticated;

create policy "Users can read their own legal consents"
on public.legal_consents
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.record_registration_consents(
  input_age_band text,
  input_research_consent boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then return 'unauthorized'; end if;
  if input_age_band not in ('adult', 'minor') then return 'invalid_age_band'; end if;
  if input_age_band = 'minor' and coalesce(input_research_consent, false) then return 'guardian_required'; end if;

  insert into public.legal_consents (user_id, consent_type, document_version, age_band)
  select caller_id, 'privacy_notice', '1.0', input_age_band
  where not exists (
    select 1 from public.legal_consents
    where user_id = caller_id and consent_type = 'privacy_notice' and document_version = '1.0' and withdrawn_at is null
  );

  if coalesce(input_research_consent, false) then
    insert into public.legal_consents (user_id, consent_type, document_version, age_band)
    select caller_id, 'research_participation', '1.0', input_age_band
    where not exists (
      select 1 from public.legal_consents
      where user_id = caller_id and consent_type = 'research_participation' and document_version = '1.0' and withdrawn_at is null
    );
  end if;

  return 'recorded';
end;
$$;

revoke all on function public.record_registration_consents(text, boolean) from public, anon;
grant execute on function public.record_registration_consents(text, boolean) to authenticated;

create or replace function public.withdraw_research_consent()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then return 'unauthorized'; end if;
  update public.legal_consents
  set withdrawn_at = now()
  where user_id = auth.uid() and consent_type = 'research_participation' and withdrawn_at is null;
  return 'withdrawn';
end;
$$;

revoke all on function public.withdraw_research_consent() from public, anon;
grant execute on function public.withdraw_research_consent() to authenticated;
