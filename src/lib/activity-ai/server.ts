import { readyAttention, UNAVAILABLE_ATTENTION } from "@/lib/inference/attention";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_AI_LABELS, isActivityAILabel, type ActivityAIFeedback, type ActivityAIProvenance, type ActivityAIStatusProjection } from "./types";

type FeedbackRow = {
  status: string;
  attempt_count: number;
  safe_error_code: ActivityAIFeedback["safeErrorCode"];
  attempted_at: string | null;
  completed_at: string | null;
  probabilities: number[] | null;
  thresholds: { label: string; threshold: number; possibleThreshold?: number | null }[] | null;
  findings: { label: string; probability: number; threshold: number }[] | null;
  provenance: ActivityAIProvenance | null;
  attention_status: "ready" | "unavailable";
  attention_map: number[] | null;
  attention_grid_width: 7 | null; attention_grid_height: 7 | null; attention_method: string | null; attention_normalization: string | null;
};

export async function getStudentActivityAIFeedback(activityId: string): Promise<ActivityAIFeedback> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_student_activity_ai_feedback", { target_activity_id: activityId }).maybeSingle<FeedbackRow>();
  if (error || !data) return { status: "locked", attemptCount: 0, safeErrorCode: null, attemptedAt: null, completedAt: null, result: null };
  const status = data.status === "released" ? "ready" : data.status === "failed" ? "failed" : data.status === "pending_analysis" ? "pending" : "locked";
  // Same "possible" rule as postprocessLogits in Learning Mode; rows saved before possible thresholds were stored have none.
  const labels = data.probabilities?.map((probability, index) => {
    const threshold = data.thresholds?.[index]?.threshold ?? 0;
    const possibleThreshold = data.thresholds?.[index]?.possibleThreshold;
    const candidate = data.thresholds?.[index]?.label;
    const label = isActivityAILabel(candidate) ? candidate : ACTIVITY_AI_LABELS[index];
    const predicted = probability >= threshold;
    return { label, probability, threshold, predicted, possible: !predicted && label !== "No Finding" && possibleThreshold != null && probability >= possibleThreshold };
  });
  const result = status === "ready" && labels && data.thresholds && data.findings && data.provenance
    ? {
        state: data.findings.length ? ("predicted" as const) : ("no-threshold-match" as const),
        labels,
        findings: data.findings.flatMap((finding) => {
          const label = isActivityAILabel(finding.label) ? finding.label : null;
          return label ? [{ label, probability: finding.probability, threshold: finding.threshold, predicted: true, possible: false }] : [];
        }),
        possibleFindings: labels.filter((item) => item.possible),
        provenance: data.provenance,
        attention: data.attention_status === "ready" && data.attention_map ? readyAttention(data.attention_map) : UNAVAILABLE_ATTENTION,
        attentionStatus: data.attention_status,
      }
    : null;
  return { status, attemptCount: data.attempt_count, safeErrorCode: data.safe_error_code, attemptedAt: data.attempted_at, completedAt: data.completed_at, result };
}

type StatusRow = {
  status: string;
  attempt_count: number;
  safe_error_code: ActivityAIStatusProjection["safeErrorCode"];
  attempted_at: string | null;
  claim_expires_at: string | null;
  completed_at: string | null;
  release_id: string | null;
  manifest_version: 1 | 2 | null;
  preprocessing_version: string | null;
  threshold_version: string | null;
  execution_provider: ActivityAIStatusProjection["executionProvider"];
  application_build: string | null;
  attention_status: "ready" | "unavailable";
  attention_map: number[] | null;
  attention_grid_width: 7 | null; attention_grid_height: 7 | null; attention_method: string | null; attention_normalization: string | null;
};

export async function getProfessorActivityAIStatus(activityId: string): Promise<ActivityAIStatusProjection> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_professor_activity_ai_status", { target_activity_id: activityId }).maybeSingle<StatusRow>();
  if (error || !data) return { status: "not_started", attemptCount: 0, safeErrorCode: null, attemptedAt: null, claimExpiresAt: null, completedAt: null, releaseId: null, manifestVersion: null, preprocessingVersion: null, thresholdVersion: null, executionProvider: null, applicationBuild: null, attentionStatus: "unavailable" };
  return { status: data.status === "ready" ? "ready" : data.status === "failed" ? "failed" : data.status === "pending" ? "pending" : "not_started", attemptCount: data.attempt_count, safeErrorCode: data.safe_error_code, attemptedAt: data.attempted_at, claimExpiresAt: data.claim_expires_at, completedAt: data.completed_at, releaseId: data.release_id, manifestVersion: data.manifest_version, preprocessingVersion: data.preprocessing_version, thresholdVersion: data.threshold_version, executionProvider: data.execution_provider, applicationBuild: data.application_build, attentionStatus: data.attention_status };
}

export async function getProfessorActivityAIHeatmap(activityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_professor_activity_ai_heatmap", { target_activity_id: activityId }).maybeSingle<{ attention_status: "ready" | "unavailable"; attention_map: number[] | null }>();
  if (error || !data || data.attention_status !== "ready" || !data.attention_map) return UNAVAILABLE_ATTENTION;
  return readyAttention(data.attention_map);
}
