import type {
  ActivityStatus,
  CaseUploadStatus,
  ProfessorActivityDetails,
  ProfessorActivitySummary,
  StudentActivityDetails,
  StudentActivitySummary,
} from "@/lib/activities/types";
import { createClient } from "@/lib/supabase/server";

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
      .select("evaluation")
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
  } satisfies ProfessorActivityDetails;
}

export async function getStudentActivities(limit?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("activities")
    .select(
      "id, workspace_id, case_id, title, instructions, due_at, status, published_at, updated_at, workspaces!inner(name)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);
  const { data, error } = await query.returns<ActivityRow[]>();
  if (error) return { data: [] as StudentActivitySummary[], error: error.message };

  return {
    data: data.flatMap((row) =>
      row.published_at
        ? [
            {
              id: row.id,
              workspaceId: row.workspace_id,
              workspaceName: row.workspaces.name,
              title: row.title,
              dueAt: row.due_at,
              publishedAt: row.published_at,
            } satisfies StudentActivitySummary,
          ]
        : [],
    ),
    error: null,
  };
}

export async function getStudentActivity(activityId: string) {
  const supabase = await createClient();
  const { data: activity, error } = await supabase
    .from("activities")
    .select(
      "id, workspace_id, case_id, title, instructions, due_at, status, published_at, updated_at, workspaces!inner(name)",
    )
    .eq("id", activityId)
    .eq("status", "published")
    .maybeSingle<ActivityRow>();

  if (error || !activity?.case_id || !activity.published_at) return null;

  const path = `${activity.workspace_id}/${activity.case_id}`;
  const signedUrlResult = await supabase.storage
    .from("activity-cases")
    .createSignedUrl(path, 600);

  return {
    id: activity.id,
    workspaceId: activity.workspace_id,
    workspaceName: activity.workspaces.name,
    title: activity.title,
    instructions: activity.instructions,
    dueAt: activity.due_at,
    publishedAt: activity.published_at,
    imageUrl: signedUrlResult.data?.signedUrl ?? null,
    imageError: Boolean(signedUrlResult.error),
  } satisfies StudentActivityDetails;
}
