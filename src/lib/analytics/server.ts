import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getProfessorActivities } from "@/lib/activities/server";
import { getProfessorSubmissions } from "@/lib/evaluations/server";
import { evaluationUuid } from "@/lib/evaluations/types";
import { getProfessorWorkspace } from "@/lib/workspaces/server";
import { summarizeClass, type AICall, type ClassSummary } from "./summary";

// ponytail: aggregates in memory per request; fine at class sizes, move to a SQL view if rosters reach thousands.
export async function getClassAnalytics(profileId: string, workspaceId: string, activityId = ""): Promise<{ data: ClassSummary | null; error: string | null }> {
  if (!evaluationUuid.test(workspaceId) || (activityId && !evaluationUuid.test(activityId))) {
    return { data: null, error: "Choose a valid workspace and activity." };
  }
  const workspace = await getProfessorWorkspace(profileId, workspaceId);
  if (!workspace) return { data: null, error: "You are not authorized to view this workspace." };
  const supabase = await createClient();
  const [activities, submissions, aiCalls] = await Promise.all([
    getProfessorActivities({ workspaceId }),
    getProfessorSubmissions({ workspaceId, activityId }),
    supabase.rpc("get_professor_workspace_ai_calls", { target_workspace_id: workspaceId }),
  ]);
  if (activities.error || submissions.error || aiCalls.error) return { data: null, error: "Analytics could not be loaded. Please try again." };
  return {
    data: summarizeClass({
      students: workspace.members.filter((member) => member.role === "student").map((member) => ({ id: member.user_id, name: member.display_name })),
      activities: activities.data
        .filter((activity) => activity.status !== "draft" && (!activityId || activity.id === activityId))
        .map((activity) => ({ id: activity.id, title: activity.title, dueAt: activity.dueAt })),
      submissions: submissions.data.map((row) => ({
        activityId: row.activity_id, studentId: row.student_id, submittedAt: row.submitted_at, classification: row.classification,
        evaluation: row.faculty_evaluations ? { status: row.faculty_evaluations.status, score: row.faculty_evaluations.score === null ? null : Number(row.faculty_evaluations.score) } : null,
      })),
      aiCalls: new Map(((aiCalls.data ?? []) as { activity_id: string; ai_call: AICall }[]).map((row) => [row.activity_id, row.ai_call])),
      now: new Date(),
    }),
    error: null,
  };
}
