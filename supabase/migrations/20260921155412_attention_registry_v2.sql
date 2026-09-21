create or replace function public.register_model_release(target_release_id text, target_model_sha256 text, target_bundle_sha256 text, target_model_byte_size bigint, target_model_path text, target_manifest_path text, target_manifest jsonb, target_validation_summary jsonb, actor text)
returns bigint language plpgsql set search_path = '' as $$
declare existing_release public.model_releases%rowtype; registered_release_id bigint; version smallint;
begin
  version := case when target_manifest ->> 'schemaVersion' = '2' then 2 else 1 end;
  select * into existing_release from public.model_releases where slot='thoraxscan-classifier' and release_id=target_release_id;
  if found then
    if existing_release.bundle_sha256=target_bundle_sha256 and existing_release.model_sha256=target_model_sha256 and existing_release.manifest=target_manifest then return existing_release.id; end if;
    raise exception using errcode='23505', message='release id is already registered with different content';
  end if;
  insert into public.model_releases(release_id,contract_version,model_sha256,bundle_sha256,model_byte_size,model_path,manifest_path,manifest,validation_summary,registered_by)
  values(target_release_id,version,target_model_sha256,target_bundle_sha256,target_model_byte_size,target_model_path,target_manifest_path,target_manifest,target_validation_summary,actor) returning id into registered_release_id;
  return registered_release_id;
end; $$;
