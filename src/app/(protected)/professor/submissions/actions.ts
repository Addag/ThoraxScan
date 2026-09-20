"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { evaluationUuid, type EvaluationActionState } from "@/lib/evaluations/types";
import { evaluationActionResult, normalizeEvaluation, validateEvaluation } from "@/lib/evaluations/validation";

async function save(submissionId: string, formData: FormData, release: boolean): Promise<EvaluationActionState> {
  const { profile } = await getCurrentProfile();
  if (profile?.role !== "professor" || profile.professor_application_status !== "approved") return evaluationActionResult("unauthorized");
  if (!evaluationUuid.test(submissionId)) return evaluationActionResult("unavailable");
  const supabase = await createClient();
  // RLS independently enforces current workspace membership before invoking the RPC.
  const { data: submission, error: accessError } = await supabase.from("student_submissions")
    .select("activity_id, activities!inner(workspace_id)").eq("id", submissionId).eq("status", "submitted")
    .maybeSingle<{ activity_id: string; activities: { workspace_id: string } }>();
  if (accessError || !submission) return evaluationActionResult("unavailable");
  if (release && formData.get("confirmed") !== "yes") return { status: "error", message: "Confirm that release is permanent before continuing." };
  const read = (key: string) => { const value = formData.get(key); return typeof value === "string" ? value : ""; };
  const values = normalizeEvaluation({ score: read("score"), remarks: read("remarks"), feedback: read("feedback") });
  const fieldErrors = validateEvaluation(values, release);
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Check the evaluation fields.", fieldErrors };
  const { data, error } = await supabase.rpc("save_faculty_evaluation", {
    target_submission_id: submissionId, input_score: values.score === "" ? null : Number(values.score),
    input_remarks: values.remarks, input_feedback: values.feedback, release_evaluation: release,
  });
  const result = evaluationActionResult(error ? null : data);
  if (["draft_saved", "released", "already_released"].includes(result.status)) {
    for (const path of ["/professor", "/professor/submissions", `/professor/submissions/${submissionId}`,
      "/professor/activities", `/professor/activities/${submission.activity_id}`, `/professor/workspaces/${submission.activities.workspace_id}`,
      "/student", "/student/activities", `/student/activities/${submission.activity_id}`]) revalidatePath(path);
  }
  return result;
}
export async function saveFacultyEvaluationAction(submissionId: string, _previous: EvaluationActionState, formData: FormData) {
  return save(submissionId, formData, false);
}
export async function releaseFacultyEvaluationAction(submissionId: string, _previous: EvaluationActionState, formData: FormData) {
  return save(submissionId, formData, true);
}
