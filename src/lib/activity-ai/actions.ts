"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityAIPersistencePayload } from "./adapter";

export async function claimActivityAIAnalysis(activityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_activity_ai_analysis", { target_activity_id: activityId }).maybeSingle<{
    status: "pending" | "ready";
    attempt_id: string;
    attempt_count: number;
    claim_expires_at: string;
  }>();
  if (error || !data) return { ok: false as const, code: "unavailable" as const };
  return { ok: true as const, status: data.status, attemptId: data.attempt_id, attemptCount: data.attempt_count, claimExpiresAt: data.claim_expires_at };
}

export async function completeActivityAIAnalysis(activityId: string, attemptId: string, payload: ActivityAIPersistencePayload) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_activity_ai_analysis", {
    target_activity_id: activityId,
    target_attempt_id: attemptId,
    input_probabilities: payload.probabilities,
    input_attention_map: payload.attentionMap,
    release_provenance: payload.releaseProvenance,
    provider: payload.provider,
    application_build: payload.applicationBuild,
  });
  if (error) return { ok: false as const, code: "recording_failed" as const };
  return { ok: data === "ready", code: typeof data === "string" ? data : "recording_failed" };
}

export async function failActivityAIAnalysis(activityId: string, attemptId: string, safeErrorCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fail_activity_ai_analysis", { target_activity_id: activityId, target_attempt_id: attemptId, safe_error_code: safeErrorCode });
  return { ok: !error && data === "failed" };
}

export async function refreshActivityCaseUrl(activityId: string) {
  const supabase = await createClient();
  const { data: activity, error } = await supabase.from("activities").select("id, workspace_id, case_id, status").eq("id", activityId).maybeSingle<{ id: string; workspace_id: string; case_id: string | null; status: string }>();
  if (error || !activity?.case_id || !["published", "archived"].includes(activity.status)) return { ok: false as const };
  const { data, error: signedError } = await supabase.storage.from("activity-cases").createSignedUrl(`${activity.workspace_id}/${activity.case_id}`, 600);
  return data?.signedUrl && !signedError ? { ok: true as const, url: data.signedUrl } : { ok: false as const };
}
