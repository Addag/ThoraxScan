-- Broadcast review decisions so a waiting applicant's page refreshes itself.
-- Realtime applies the existing RLS policy, so applicants only receive their own row.
alter publication supabase_realtime add table public.professor_applications;
