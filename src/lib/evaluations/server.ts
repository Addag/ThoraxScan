import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/server";
import { getProfessorActivity } from "@/lib/activities/server";
import { evaluationUuid, type ProfessorEvaluation, type ReviewStatus, type StudentFacultyEvaluation } from "./types";

type SubmissionRow = {
  id: string; activity_id: string; student_id: string; submitted_at: string;
  visible_findings: string; classification: string; relevant_region: string;
  profiles: { display_name: string } | null;
  activities: { title: string; workspace_id: string; workspaces: { name: string } };
  faculty_evaluations: ProfessorEvaluation | null;
};
const selection = "id, activity_id, student_id, submitted_at, visible_findings, classification, relevant_region, profiles!student_submissions_student_id_fkey(display_name), activities!inner(title, workspace_id, workspaces!inner(name)), faculty_evaluations(id, professor_id, score, remarks, feedback, status, released_at, updated_at)";

async function professorClient() {
  const { profile } = await getCurrentProfile();
  if (profile?.role !== "professor" || profile.professor_application_status !== "approved") return null;
  return createClient();
}
export async function getProfessorSubmissions(filters: { workspaceId?: string; activityId?: string; status?: ReviewStatus } = {}) {
  const supabase = await professorClient();
  if (!supabase) return { data: [] as SubmissionRow[], error: "You are not authorized to view submissions." };
  if ((filters.workspaceId && !evaluationUuid.test(filters.workspaceId)) || (filters.activityId && !evaluationUuid.test(filters.activityId))) {
    return { data: [] as SubmissionRow[], error: "Choose a valid workspace and activity." };
  }
  // Page through the API cap so filtering cannot silently omit older submissions.
  const rows: SubmissionRow[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from("student_submissions").select(selection).eq("status", "submitted")
      .order("submitted_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (filters.workspaceId) query = query.eq("activities.workspace_id", filters.workspaceId);
    if (filters.activityId) query = query.eq("activity_id", filters.activityId);
    const { data, error } = await query.returns<SubmissionRow[]>();
    if (error) return { data: [] as SubmissionRow[], error: "Submissions could not be loaded. Please try again." };
    rows.push(...data);
    if (data.length < 500) break;
  }
  return { data: rows.filter(row => !filters.status || (row.faculty_evaluations?.status ?? "unreviewed") === filters.status), error: null };
}
export async function getProfessorSubmission(submissionId: string) {
  if (!evaluationUuid.test(submissionId)) return null;
  const supabase = await professorClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("student_submissions").select(selection)
    .eq("id", submissionId).eq("status", "submitted").maybeSingle<SubmissionRow>();
  if (error || !data) return null;
  const activity = await getProfessorActivity(data.activity_id);
  return activity ? { ...data, activity } : null;
}
export async function getStudentActivityFacultyEvaluation(activityId: string): Promise<{ data: StudentFacultyEvaluation | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_student_activity_faculty_evaluation", { target_activity_id: activityId })
    .maybeSingle<{ status: string; score: number | null; feedback: string | null; released_at: string | null }>();
  if (error) return { data: null, error: "Faculty evaluation could not be loaded. Please reload." };
  if (data?.status === "released" && data.score !== null && data.feedback && data.released_at) {
    return { data: { status: "released", score: data.score, feedback: data.feedback, releasedAt: data.released_at }, error: null };
  }
  return { data: data?.status === "locked" || data?.status === "awaiting_review" ? { status: data.status } : null, error: null };
}
