begin;

create extension if not exists pgtap with schema extensions;
select plan(22);
create temporary table registry_baseline as select revision, (select count(*) from public.model_activation_events) as events from public.model_slots where slot = 'thoraxscan-classifier';

select has_table('public', 'model_releases', 'model release registry exists');
select has_table('public', 'model_slots', 'active model slot exists');
select has_table('public', 'model_activation_events', 'activation history exists');
select is(
  (select count(*) from public.model_slots where slot = 'thoraxscan-classifier'),
  1::bigint,
  'the classifier slot is seeded once'
);
select ok(
  not has_table_privilege('authenticated', 'public.model_releases', 'select'),
  'authenticated cannot read candidate releases'
);
select ok(
  not has_table_privilege('authenticated', 'public.model_activation_events', 'select'),
  'authenticated cannot read activation history'
);
select ok(
  not has_table_privilege('authenticated', 'public.model_slots', 'update'),
  'authenticated cannot mutate the active slot'
);
select ok(
  has_function_privilege('authenticated', 'public.get_active_model_release()', 'execute'),
  'authenticated may execute only the active-release RPC'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.activate_model_release(bigint,bigint,text,text)',
    'execute'
  ),
  'authenticated cannot activate releases'
);

select public.register_model_release(
  'release-a',
  repeat('a', 64),
  repeat('b', 64),
  1024,
  'artifacts/sha256/' || repeat('a', 64) || '/model.onnx',
  'bundles/sha256/' || repeat('b', 64) || '/manifest.json',
  jsonb_build_object(
    'schemaVersion', 1,
    'release', jsonb_build_object('id', 'release-a'),
    'artifact', jsonb_build_object(
      'sha256', repeat('a', 64),
      'path', 'artifacts/sha256/' || repeat('a', 64) || '/model.onnx'
    )
  ),
  '{"passed": true}'::jsonb,
  'database-test'
);

select is(
  public.register_model_release(
    'release-a',
    repeat('a', 64),
    repeat('b', 64),
    1024,
    'artifacts/sha256/' || repeat('a', 64) || '/model.onnx',
    'bundles/sha256/' || repeat('b', 64) || '/manifest.json',
    jsonb_build_object(
      'schemaVersion', 1,
      'release', jsonb_build_object('id', 'release-a'),
      'artifact', jsonb_build_object(
        'sha256', repeat('a', 64),
        'path', 'artifacts/sha256/' || repeat('a', 64) || '/model.onnx'
      )
    ),
    '{"passed": true}'::jsonb,
    'database-test'
  ),
  (select id from public.model_releases where release_id = 'release-a'),
  'registering identical content is idempotent'
);

select lives_ok(
  format(
    'select public.activate_model_release(%s, %s, %L, %L)',
    (select id from public.model_releases where release_id = 'release-a'),
    (select revision from registry_baseline),
    'database-test',
    'initial activation'
  ),
  'the initial activation succeeds at the expected revision'
);
select is(
  (select revision from public.model_slots where slot = 'thoraxscan-classifier'),
  (select revision + 1 from registry_baseline),
  'activation increments the slot revision'
);
select is(
  (select count(*) from public.model_activation_events),
  (select events + 1 from registry_baseline),
  'activation appends one history event'
);
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select is(
  (select release_id from public.get_active_model_release()),
  'release-a',
  'an authenticated caller can resolve only the active release'
);
set local request.jwt.claim.sub = '';
select throws_ok(
  format(
    'select public.activate_model_release(%s, %s, %L, %L)',
    (select id from public.model_releases where release_id = 'release-a'),
    (select revision from registry_baseline),
    'database-test',
    'stale activation'
  ),
  '40001',
  'model slot revision changed',
  'a stale expected revision is rejected'
);
select lives_ok(
  $$select public.activate_model_release(null, (select revision + 1 from registry_baseline), 'database-test', 'failed initial activation compensation')$$,
  'a compensating activation can restore an initially empty slot'
);
select ok(
  (select active_model_release_id is null and revision = (select revision + 2 from registry_baseline) from public.model_slots where slot = 'thoraxscan-classifier'),
  'initial activation compensation clears the pointer and advances history'
);
select throws_ok(
  format(
    'update public.model_releases set registered_by = %L where release_id = %L',
    'changed',
    'release-a'
  ),
  '42501',
  'model releases and activation events are immutable',
  'registered releases are immutable'
);
select throws_ok(
  format(
    'delete from public.model_activation_events where slot = %L',
    'thoraxscan-classifier'
  ),
  '42501',
  'model releases and activation events are immutable',
  'activation history is append-only'
);
select is(
  (select release_id from public.get_active_model_release()),
  null::text,
  'the active RPC fails closed without an authenticated user'
);
select is(
  (select public from storage.buckets where id = 'model-artifacts'),
  true,
  'the model artifact bucket is public-read'
);
select is(
  (select file_size_limit from storage.buckets where id = 'model-artifacts'),
  52428800::bigint,
  'the model artifact bucket enforces the 50 MiB limit'
);

select * from finish();
rollback;
