import type { StudentSubmission, SubmissionStatus } from "@/lib/submissions/types";
import type {
  ActivityStatus,
  CaseUploadStatus,
  ProfessorActivityDetails,
  ProfessorActivitySummary,
  StudentActivityDetails,
  StudentActivitySummary,
} from "@/lib/activities/types";
import { createClient } from "@/lib/supabase/server";
import { getProfessorActivityAIResult, getProfessorActivityAIStatus, getStudentActivityAIFeedback } from "@/lib/activity-ai/server";
import { normalizeAnswers, normalizeLabels } from "@/lib/submissions/validation";

type ActivityRow = {
  id: string;
  workspace_id: string;
  case_id: string | null;
  title: string;
  instructions: string;
  due_at: string | null;
  status: ActivityStatus;
  published_at: string | null;
  updated_at: string;
  workspaces: { name: string };
};

type ReferenceRow = {
  evaluation: string;
  validated_labels: string[] | null;
  validated_heatmap: number[] | null;
};

type CaseRow = {
  upload_status: CaseUploadStatus;
  mime_type: string;
  byte_size: number;
};

function professorSummary(row: ActivityRow): ProfessorActivitySummary {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: row.workspaces.name,
    title: row.title,
    dueAt: row.due_at,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    hasCase: row.case_id !== null,
  };
}

export async function getProfessorActivities(filters?: {
  workspaceId?: string;
  status?: ActivityStatus;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("activities")
    .select(
      "id, workspace_id, case_id, title, instructions, due_at, status, published_at, updated_at, workspaces!inner(name)",
    )
    .order("updated_at", { ascending: false });

  if (filters?.workspaceId) query = query.eq("workspace_id", filters.workspaceId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query.returns<ActivityRow[]>();
  if (error) return { data: [] as ProfessorActivitySummary[], error: error.message };
  return { data: data.map(professorSummary), error: null };
}

export async function getProfessorActivity(activityId: string) {
  const supabase = await createClient();
  const [activityResult, referenceResult] = await Promise.all([
    supabase
      .from("activities")
      .select(
        "id, workspace_id, case_id, title, instructions, due_at, status, published_at, updated_at, workspaces!inner(name)",
      )
      .eq("id", activityId)
      .maybeSingle<ActivityRow>(),
    supabase
      .from("activity_reference_evaluations")
      .select("evaluation, validated_labels, validated_heatmap")
      .eq("activity_id", activityId)
      .maybeSingle<ReferenceRow>(),
  ]);

  const activity = activityResult.data;
  if (activityResult.error || referenceResult.error || !activity) return null;

  let caseRow: CaseRow | null = null;
  let imageUrl: string | null = null;
  let imageError = false;

  if (activity.case_id) {
    const path = `${activity.workspace_id}/${activity.case_id}`;
    const [caseResult, signedUrlResult] = await Promise.all([
      supabase
        .from("xray_cases")
        .select("upload_status, mime_type, byte_size")
        .eq("id", activity.case_id)
        .eq("workspace_id", activity.workspace_id)
        .maybeSingle<CaseRow>(),
      supabase.storage.from("activity-cases").createSignedUrl(path, 600),
    ]);

    caseRow = caseResult.data;
    imageUrl = signedUrlResult.data?.signedUrl ?? null;
    imageError = Boolean(caseResult.error || signedUrlResult.error);
  }

  const aiStatus = await getProfessorActivityAIStatus(activityId);
  const aiResult = aiStatus.status === "ready" ? await getProfessorActivityAIResult(activityId) : null;
  return {
    ...professorSummary(activity),
    caseId: activity.case_id,
    instructions: activity.instructions,
    referenceEvaluation: referenceResult.data?.evaluation ?? "",
    caseUploadStatus: caseRow?.upload_status ?? null,
    caseMimeType: caseRow?.mime_type ?? null,
    caseByteSize: caseRow?.byte_size ?? null,
    imageUrl,
    imageError,
    aiStatus,
    aiFindings: aiResult?.findings ?? null,
    aiHeatmap: aiResult?.heatmap ?? null,
    validatedLabels: referenceResult.data?.validated_labels ? normalizeLabels(referenceResult.data.validated_labels) : null,
    validatedHeatmap: referenceResult.data?.validated_heatmap ?? null,
  } satisfies ProfessorActivityDetails;
}

type SubmissionRow = {
  id: string; selected_labels: string[]; label_answers: Record<string, unknown>; student_heatmap: number[] | null;
  status: SubmissionStatus; created_at: string; updated_at: string; submitted_at: string | null;
};
type StudentActivityRow = ActivityRow & { student_submissions: SubmissionRow[] };
function projectSubmission(row?: SubmissionRow): StudentSubmission | null {
  const labels = row ? normalizeLabels(row.selected_labels) : [];
  return row ? { id: row.id, labels, answers: normalizeAnswers(row.label_answers ?? {}, labels),
    heatmap: row.student_heatmap, status: row.status, createdAt: row.created_at,
    updatedAt: row.updated_at, submittedAt: row.submitted_at } : null;
}

export async function getStudentActivities(limit?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as StudentActivitySummary[], error: "Unauthorized" };
  let query = supabase
    .from("activities")
    .select(
      "id, workspace_id, title, due_at, published_at, workspaces!inner(name), student_submissions(status)",
    )
    .eq("status", "published")
    .eq("student_submissions.student_id", user.id)
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);
  const { data, error } = await query.returns<(Pick<ActivityRow, "id" | "workspace_id" | "title" | "due_at" | "published_at" | "workspaces"> & { student_submissions: { status: SubmissionStatus }[] })[]>();
  if (error) return { data: [] as StudentActivitySummary[], error: error.message };

  const projected = await Promise.all(data.flatMap((row) => row.published_at ? [(row.student_submissions[0]?.status === "submitted" ? getStudentActivityAIFeedback(row.id) : Promise.resolve({ status: "locked" as const })).then((feedback) => ({
    submissionStatus: row.student_submissions[0]?.status ?? null,
    aiStatus: feedback.status,
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: row.workspaces.name,
    title: row.title,
    dueAt: row.due_at,
    publishedAt: row.published_at!,
  } satisfies StudentActivitySummary))] : []));
  return {
    data: projected,
    error: null,
  };
}

export async function getStudentActivity(activityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: activity, error } = await supabase
    .from("activities")
    .select(
      "id, workspace_id, case_id, title, instructions, due_at, status, published_at, updated_at, workspaces!inner(name), student_submissions(id, selected_labels, label_answers, student_heatmap, status, created_at, updated_at, submitted_at)",
    )
    .eq("id", activityId)
    .eq("status", "published")
    .eq("student_submissions.student_id", user.id)
    .maybeSingle<StudentActivityRow>();

  if (error || !activity?.case_id || !activity.published_at) return null;

  const path = `${activity.workspace_id}/${activity.case_id}`;
  const [signedUrlResult, heatmapRequired] = await Promise.all([
    supabase.storage.from("activity-cases").createSignedUrl(path, 600),
    supabase.rpc("activity_requires_student_heatmap", { target_activity_id: activityId }),
  ]);

  const aiFeedback = activity.student_submissions[0]?.status === "submitted"
    ? await getStudentActivityAIFeedback(activityId)
    : { status: "locked" as const, attemptCount: 0, safeErrorCode: null, attemptedAt: null, completedAt: null, result: null };
  return {
    submissionStatus: activity.student_submissions[0]?.status ?? null,
    aiStatus: aiFeedback.status,
    submission: projectSubmission(activity.student_submissions[0]),
    id: activity.id,
    workspaceId: activity.workspace_id,
    workspaceName: activity.workspaces.name,
    title: activity.title,
    instructions: activity.instructions,
    dueAt: activity.due_at,
    publishedAt: activity.published_at,
    imageUrl: signedUrlResult.data?.signedUrl ?? null,
    imageError: Boolean(signedUrlResult.error),
    heatmapRequired: heatmapRequired.data === true,
    aiFeedback,
  } satisfies StudentActivityDetails;
}
