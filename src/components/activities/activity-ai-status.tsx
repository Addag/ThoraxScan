"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InferenceError } from "@/lib/inference/errors";
import { toActivityAIPersistencePayload } from "@/lib/activity-ai/adapter";
import { claimActivityAIAnalysis, completeActivityAIAnalysis, failActivityAIAnalysis, refreshActivityCaseUrl } from "@/lib/activity-ai/actions";
import type { ActivityAIStatusProjection } from "@/lib/activity-ai/types";
import { activityButton } from "@/components/activities/activity-button";

export function ActivityAIStatus({ activityId, imageUrl, activityStatus, initial }: { activityId: string; imageUrl: string | null; activityStatus: "draft" | "published" | "archived"; initial: ActivityAIStatusProjection }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [running, setRunning] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function retry() {
    if (running || activityStatus !== "published") return;
    const controller = new AbortController(); controllerRef.current = controller; setRunning(true);
    let attemptId: string | null = null;
    try {
      const claim = await claimActivityAIAnalysis(activityId);
      if (!claim.ok) throw new Error("claim_failed");
      if (claim.status === "ready") { router.refresh(); return; }
      attemptId = claim.attemptId;
      let response = imageUrl ? await fetch(imageUrl, { signal: controller.signal }) : null;
      if (!response || !response.ok) {
        const refreshed = await refreshActivityCaseUrl(activityId);
        if (!refreshed.ok) throw new Error("case_unavailable");
        response = await fetch(refreshed.url, { signal: controller.signal });
      }
      if (!response.ok) throw new Error("case_unavailable");
      const { analyzeImage } = await import("@/lib/inference/runtime");
      const result = await analyzeImage(await response.blob(), { signal: controller.signal });
      if (controller.signal.aborted) return;
      const recorded = await completeActivityAIAnalysis(activityId, attemptId, toActivityAIPersistencePayload(result));
      if (!recorded.ok) throw new Error(recorded.code);
      router.refresh();
    } catch (error) {
      if (!controller.signal.aborted) {
        if (attemptId) await failActivityAIAnalysis(activityId, attemptId, error instanceof InferenceError ? error.code.toLowerCase() : "recording_failed");
        setStatus((current) => ({ ...current, status: "failed", safeErrorCode: "recording_failed" }));
      }
    } finally { if (controllerRef.current === controller) controllerRef.current = null; setRunning(false); }
  }

  const label = activityStatus === "draft" ? "Unavailable until this activity is published" : activityStatus === "archived" ? "Read-only · no new attempts" : status.status === "not_started" ? "Waiting for submission" : status.status === "pending" ? "Pending · retry available after lease expiry" : status.status === "ready" ? "Ready" : "Failed";
  return <section className="activity-ai-status" aria-labelledby="activity-ai-status-title"><div className="activity-panel-title"><span aria-hidden="true">✦</span><h2 id="activity-ai-status-title">AI analysis</h2></div><p className="activity-ai-copy"><strong>{label}</strong></p>{status.attemptedAt ? <p className="activity-ai-meta">Last attempt <time dateTime={status.attemptedAt}>{new Date(status.attemptedAt).toLocaleString()}</time></p> : null}{status.status === "failed" || status.status === "pending" ? <><p className="activity-ai-copy">No prediction was released. Students remain locked until analysis succeeds.</p><button className={`${activityButton.primary} mx-4 mt-0 mb-4`} type="button" disabled={running || activityStatus !== "published"} onClick={() => void retry()}>{running ? "Retrying…" : "Retry analysis"}</button></> : null}{status.status === "ready" ? <dl className="activity-ai-meta"><div><dt>Release</dt><dd>{status.releaseId}</dd></div><div><dt>Provider</dt><dd>{status.executionProvider?.toUpperCase()}</dd></div><div><dt>Application build</dt><dd>{status.applicationBuild}</dd></div></dl> : null}</section>;
}
