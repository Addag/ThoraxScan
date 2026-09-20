"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InferenceError } from "@/lib/inference/errors";
import { toActivityAIPersistencePayload } from "@/lib/activity-ai/adapter";
import { claimActivityAIAnalysis, completeActivityAIAnalysis, failActivityAIAnalysis, refreshActivityCaseUrl } from "@/lib/activity-ai/actions";
import type { ActivityAIFeedback } from "@/lib/activity-ai/types";

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
  return <section className="activity-ai-feedback" aria-labelledby="activity-ai-feedback-title">
    <div className="activity-panel-title"><span aria-hidden="true">✦</span><h2 id="activity-ai-feedback-title">AI feedback</h2></div>
    {feedback.status === "locked" ? <p className="activity-ai-copy">Submit your final evaluation to unlock controlled AI feedback.</p> : null}
    {feedback.status === "pending" || running ? <p role="status" className="activity-ai-copy">{message || "Analysis is pending…"}</p> : null}
    {feedback.status === "failed" && !running ? <div className="activity-ai-copy"><p role="alert">{message || "Analysis failed. No prediction was released."}</p><button className="activity-primary-button" type="button" onClick={() => { startedRef.current = false; void runAnalysis(); }}>Retry analysis</button></div> : null}
    {feedback.status === "ready" && result ? <div className="activity-ai-result">
      <p className="activity-ai-disclaimer">Educational use only. This result is not a diagnosis and should not guide medical decisions.</p>
      <h3>Thresholded findings</h3>
      {result.findings.length ? <ul>{result.findings.map((finding) => <li key={finding.label}><strong>{finding.label}</strong> · {(finding.probability * 100).toFixed(1)}%</li>)}</ul> : <p>No finding met its configured threshold.</p>}
      {result.labels.some((item) => item.predicted && !result.findings.some((finding) => finding.label === item.label)) ? <p className="activity-ai-suppressed">No Finding is suppressed when an abnormal finding is present.</p> : null}
      <details><summary>All 14 probabilities and thresholds</summary><ul>{result.labels.map((item) => <li key={item.label}><strong>{item.label}</strong>: {(item.probability * 100).toFixed(2)}% · threshold {item.threshold}</li>)}</ul></details>
      <details><summary>Release and execution provenance</summary><dl><dt>Model release</dt><dd>{result.provenance.releaseId}</dd><dt>Preprocessing</dt><dd>{result.provenance.preprocessingVersion}</dd><dt>Thresholds</dt><dd>{result.provenance.thresholdVersion}</dd><dt>Provider</dt><dd>{result.provenance.executionProvider.toUpperCase()}</dd><dt>Model SHA-256</dt><dd>{result.provenance.modelSha256}</dd><dt>Bundle SHA-256</dt><dd>{result.provenance.bundleSha256}</dd><dt>Application build</dt><dd>{result.provenance.applicationBuild}</dd></dl></details>
      <p className="activity-ai-copy">Attention heatmap unavailable for this model release.</p>
    </div> : null}
  </section>;
}
