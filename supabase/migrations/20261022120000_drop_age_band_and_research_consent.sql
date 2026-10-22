-- Registration no longer asks for an age group or in-app research consent.
-- Delete the answers already stored and keep only privacy-notice records.

drop function public.record_registration_consents(text, boolean);
drop function public.withdraw_research_consent();

delete from public.legal_consents
where consent_type = 'research_participation';

alter table public.legal_consents
  drop column age_band,
  drop constraint legal_consents_type_valid,
  add constraint legal_consents_type_valid check (consent_type = 'privacy_notice');

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'age_band' - 'research_consent'
where raw_user_meta_data ?| array['age_band', 'research_consent'];

-- Every published policy version stays accepted, so a sign-up confirmed after
-- a policy change still records the version shown at registration.
create function public.record_registration_consents(
  input_policy_version text
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
  if coalesce(input_policy_version, '') not in ('1.0', '1.1') then return 'invalid_version'; end if;

  insert into public.legal_consents (user_id, consent_type, document_version)
  select caller_id, 'privacy_notice', input_policy_version
  where not exists (
    select 1 from public.legal_consents
    where user_id = caller_id and consent_type = 'privacy_notice' and document_version = input_policy_version and withdrawn_at is null
  );

  return 'recorded';
end;
$$;

revoke all on function public.record_registration_consents(text) from public, anon;
grant execute on function public.record_registration_consents(text) to authenticated;
