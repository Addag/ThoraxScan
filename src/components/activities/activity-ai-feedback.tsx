"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InferenceError } from "@/lib/inference/errors";
import { toActivityAIPersistencePayload } from "@/lib/activity-ai/adapter";
import { claimActivityAIAnalysis, completeActivityAIAnalysis, failActivityAIAnalysis, refreshActivityCaseUrl } from "@/lib/activity-ai/actions";
import type { ActivityAIFeedback } from "@/lib/activity-ai/types";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { AnalysisFindings } from "@/components/analysis-findings";
import { activityButton } from "@/components/activities/activity-button";
import { ActivityPanelTitle } from "@/components/activities/activity-ui";

function safeCode(error: unknown) {
  if (error instanceof InferenceError) return error.code.toLowerCase();
  if (error instanceof Error && error.name === "AbortError") return "aborted";
  return "recording_failed";
}

export function ActivityAIFeedback({ activityId, imageUrl, initial }: { activityId: string; imageUrl: string | null; initial: ActivityAIFeedback }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(initial);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => setFeedback(initial), [initial]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function runAnalysis() {
    if (running || feedback.status === "locked" || feedback.status === "ready") return;
    startedRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true); setMessage("Preparing browser analysis…");
    let attemptId: string | null = null;
    try {
      const claim = await claimActivityAIAnalysis(activityId);
      if (!claim.ok) throw new Error("claim_failed");
      if (claim.status === "ready") { router.refresh(); return; }
      attemptId = claim.attemptId;
      let url = imageUrl;
      let response = url ? await fetch(url, { signal: controller.signal }) : null;
      if (!response || !response.ok) {
        const refreshed = await refreshActivityCaseUrl(activityId);
        if (!refreshed.ok) throw new Error("case_unavailable");
        url = refreshed.url;
        response = await fetch(url, { signal: controller.signal });
      }
      if (!response.ok) throw new Error("case_unavailable");
      setMessage("Analyzing securely in this browser…");
      const { analyzeImage } = await import("@/lib/inference/runtime");
      const result = await analyzeImage(await response.blob(), { signal: controller.signal });
      if (controller.signal.aborted) return;
      const recorded = await completeActivityAIAnalysis(activityId, attemptId, toActivityAIPersistencePayload(result));
      if (!recorded.ok) throw new Error(recorded.code);
      setMessage("Analysis recorded. Waiting for the released result…");
      router.refresh();
    } catch (error) {
      if (controller.signal.aborted) return;
      if (attemptId) await failActivityAIAnalysis(activityId, attemptId, safeCode(error));
      setFeedback((current) => ({ ...current, status: "failed", safeErrorCode: safeCode(error) as ActivityAIFeedback["safeErrorCode"] }));
      setMessage("Analysis could not be completed. Your final submission remains saved; try again.");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setRunning(false);
    }
  }

  useEffect(() => {
    if (feedback.status === "pending" && !startedRef.current) void runAnalysis();
    // The pending state is the server-approved post-submission gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.status]);

  const result = feedback.result;
  return <section className="overflow-hidden rounded-[10px] border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow)" aria-labelledby="activity-ai-feedback-title">
    <ActivityPanelTitle icon="✦" title="AI feedback" titleId="activity-ai-feedback-title" />
    {feedback.status === "locked" ? <p className="m-0 px-4 py-3.5 text-[0.75rem] leading-[1.55] text-(--text-secondary)">Submit your final evaluation to unlock controlled AI feedback.</p> : null}
    {feedback.status === "pending" || running ? <p role="status" className="m-0 px-4 py-3.5 text-[0.75rem] leading-[1.55] text-(--text-secondary)">{message || "Analysis is pending…"}</p> : null}
    {feedback.status === "failed" && !running ? <div className="m-0 px-4 py-3.5 text-[0.75rem] leading-[1.55] text-(--text-secondary)"><p role="alert">{message || "Analysis failed. No prediction was released."}</p><button className={`${activityButton.primary} mx-4 mt-0 mb-4`} type="button" onClick={() => { startedRef.current = false; void runAnalysis(); }}>Retry analysis</button></div> : null}
    {feedback.status === "ready" && result ? <div className="m-0 px-4 py-3.5 text-[0.75rem] leading-[1.55] text-(--text-secondary) [&_dl]:mt-3 [&_dl]:grid [&_dl]:grid-cols-[minmax(90px,.8fr)_minmax(0,1.2fr)] [&_dl]:gap-x-3 [&_dl]:gap-y-[7px] [&_dt]:text-[#8e9bb0] light:[&_dt]:text-(--text-muted) [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere]">
      <p className="border-l-[3px] border-l-(color:--disclaimer-yellow) pl-2.5 text-[#ffe28a] light:text-(--status-warning-text)">Educational use only. This result is not a diagnosis and should not guide medical decisions.</p>
      <AnalysisFindings state={result.state} labels={result.labels} findings={result.findings} possibleFindings={result.possibleFindings} idPrefix="activity" />
      <details className="mt-[18px] border-t border-t-[#3f5271] pt-3.5"><summary className="cursor-pointer font-bold">Release and execution provenance</summary><dl><dt>Model release</dt><dd>{result.provenance.releaseId}</dd><dt>Preprocessing</dt><dd>{result.provenance.preprocessingVersion}</dd><dt>Thresholds</dt><dd>{result.provenance.thresholdVersion}</dd><dt>Provider</dt><dd>{result.provenance.executionProvider.toUpperCase()}</dd><dt>Model SHA-256</dt><dd>{result.provenance.modelSha256}</dd><dt>Bundle SHA-256</dt><dd>{result.provenance.bundleSha256}</dd><dt>Application build</dt><dd>{result.provenance.applicationBuild}</dd></dl></details>
      <AttentionHeatmap imageUrl={imageUrl} attention={result.attention ?? { status: "unavailable", reason: "legacy-model-release" }} labels={result.labels} title="Finding heatmap" />
    </div> : null}
  </section>;
}
