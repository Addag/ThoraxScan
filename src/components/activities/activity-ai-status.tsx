"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InferenceError } from "@/lib/inference/errors";
import { toActivityAIPersistencePayload } from "@/lib/activity-ai/adapter";
import { claimActivityAIAnalysis, completeActivityAIAnalysis, failActivityAIAnalysis, refreshActivityCaseUrl } from "@/lib/activity-ai/actions";
import type { ActivityAIStatusProjection } from "@/lib/activity-ai/types";
import { button } from "@/components/controls";
import { ActivityPanelTitle } from "@/components/activities/activity-ui";

export function ActivityAIStatus({ activityId, imageUrl, activityStatus, initial }: { activityId: string; imageUrl: string | null; activityStatus: "draft" | "published" | "archived"; initial: ActivityAIStatusProjection }) {
  const router = useRouter();
  // The server projection is the source of truth; only a failure seen in this browser overrides it until the next refresh.
  const [failedHere, setFailedHere] = useState(false);
  const status: ActivityAIStatusProjection = failedHere && initial.status !== "ready" ? { ...initial, status: "failed" } : initial;
  const [running, setRunning] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => () => controllerRef.current?.abort(), []);
  // Only a Professor's browser may record the analysis, so it starts here: right after publishing,
  // or on a later visit if that run was interrupted. One automatic attempt per visit.
  useEffect(() => {
    const leaseHeld = status.status === "pending" && status.claimExpiresAt !== null && new Date(status.claimExpiresAt) > new Date();
    if (activityStatus !== "published" || status.status === "ready" || leaseHeld || startedRef.current) return;
    startedRef.current = true;
    void retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityStatus, status.status]);

  async function retry() {
    if (running || activityStatus !== "published") return;
    const controller = new AbortController(); controllerRef.current = controller; setRunning(true); setFailedHere(false);
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
        setFailedHere(true);
      }
    } finally { if (controllerRef.current === controller) controllerRef.current = null; setRunning(false); }
  }

  const label = activityStatus === "draft" ? "Unavailable until this activity is published" : activityStatus === "archived" ? "Read-only · no new attempts" : running ? "Analyzing in this browser…" : status.status === "not_started" ? "Not run yet" : status.status === "pending" ? "Pending · retry available after lease expiry" : status.status === "ready" ? "Ready" : "Failed";
  return <section className="overflow-hidden rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow)" aria-labelledby="activity-ai-status-title"><ActivityPanelTitle icon="✦" title="AI analysis" titleId="activity-ai-status-title" /><p className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary)"><strong>{label}</strong></p>{status.attemptedAt ? <p className="m-0 grid grid-cols-[minmax(90px,.8fr)_minmax(0,1.2fr)] gap-x-3 gap-y-[7px] px-4 py-3.5 text-caption leading-normal text-(--text-secondary) [&_dt]:text-(--text-muted) [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere]">Last attempt <time dateTime={status.attemptedAt}>{new Date(status.attemptedAt).toLocaleString()}</time></p> : null}{activityStatus === "published" && status.status !== "ready" ? <><p className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary)">Students see AI feedback once this analysis succeeds. Keep this page open while it runs.</p><button className={`${button("primary")} mx-4 mb-4`} type="button" disabled={running || activityStatus !== "published"} onClick={() => void retry()}>{running ? "Analyzing…" : "Run analysis"}</button></> : null}{status.status === "ready" ? <dl className="m-0 grid grid-cols-[minmax(90px,.8fr)_minmax(0,1.2fr)] gap-x-3 gap-y-[7px] px-4 py-3.5 text-caption leading-normal text-(--text-secondary) [&_dt]:text-(--text-muted) [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere]"><div><dt>Release</dt><dd>{status.releaseId}</dd></div><div><dt>Provider</dt><dd>{status.executionProvider?.toUpperCase()}</dd></div><div><dt>Application build</dt><dd>{status.applicationBuild}</dd></div></dl> : null}</section>;
}
