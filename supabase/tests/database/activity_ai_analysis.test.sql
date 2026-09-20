begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public', 'ai_analyses', 'activity analyses table exists');
select has_table('public', 'ai_feedback_releases', 'feedback releases table exists');
select has_column('public', 'ai_analyses', 'probabilities', 'analysis stores the canonical probability payload');
select has_column('public', 'ai_analyses', 'attention_status', 'analysis records heatmap availability');
select has_index('public', 'ai_analyses', 'ai_analyses_activity_id_idx', 'analysis activity index exists');
select has_index('public', 'ai_feedback_releases', 'ai_feedback_releases_submission_id_key', 'release uniqueness is indexed');
select ok(not has_table_privilege('anon', 'public.ai_analyses', 'select'), 'anonymous clients cannot read analyses');
select ok(not has_table_privilege('authenticated', 'public.ai_analyses', 'insert'), 'authenticated clients cannot insert analyses directly');
select ok(not has_table_privilege('authenticated', 'public.ai_feedback_releases', 'update'), 'authenticated clients cannot mutate releases directly');
select ok(has_function_privilege('authenticated', 'public.claim_activity_ai_analysis(uuid)', 'execute'), 'authenticated clients can claim through the RPC');
select ok(has_function_privilege('authenticated', 'public.complete_activity_ai_analysis(uuid,uuid,jsonb,jsonb,text,text)', 'execute'), 'authenticated clients can complete through the RPC');
select ok(has_function_privilege('authenticated', 'public.fail_activity_ai_analysis(uuid,uuid,text)', 'execute'), 'authenticated clients can fail through the RPC');
select ok(has_function_privilege('authenticated', 'public.get_student_activity_ai_feedback(uuid)', 'execute'), 'students can use the feedback projection');
select ok(has_function_privilege('authenticated', 'public.get_professor_activity_ai_status(uuid)', 'execute'), 'professors can use the status projection');
select ok(not has_function_privilege('anon', 'public.claim_activity_ai_analysis(uuid)', 'execute'), 'anonymous clients cannot claim analysis');
select ok(not has_function_privilege('public', 'public.complete_activity_ai_analysis(uuid,uuid,jsonb,jsonb,text,text)', 'execute'), 'public clients cannot complete analysis');
select is((select conname from pg_constraint where conrelid = 'public.ai_analyses'::regclass and conname = 'ai_analyses_attention_status_valid'), 'ai_analyses_attention_status_valid', 'heatmap status is constrained to unavailable');
select is((select conname from pg_constraint where conrelid = 'public.ai_feedback_releases'::regclass and conname = 'ai_feedback_releases_status_valid'), 'ai_feedback_releases_status_valid', 'release lifecycle status is constrained');

select * from finish();
rollback;

