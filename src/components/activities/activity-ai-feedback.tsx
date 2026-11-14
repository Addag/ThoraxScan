"use client";

import { useState } from "react";
import type { ActivityAIFeedback } from "@/lib/activity-ai/types";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { AnalysisFindings } from "@/components/analysis-findings";
import { ResultDialog } from "@/components/result-dialog";
import { ActivityPanelTitle } from "@/components/activities/activity-ui";

// Read-only: the Professor's browser records the analysis, so a Student cannot choose the result classmates see.
export function ActivityAIFeedback({ imageUrl, initial: feedback }: { imageUrl: string | null; initial: ActivityAIFeedback }) {
  // Pops up only when the result arrives during this visit, not every time a finished activity is reopened.
  const [popUp] = useState(feedback.status !== "ready");
  const result = feedback.result;
  return <section className="overflow-hidden rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow)" aria-labelledby="activity-ai-feedback-title">
    <ActivityPanelTitle icon="✦" title="AI feedback" titleId="activity-ai-feedback-title" />
    {feedback.status === "locked" ? <p className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary)">Submit your final evaluation to unlock controlled AI feedback.</p> : null}
    {feedback.status === "pending" || feedback.status === "failed" ? <p role="status" className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary)">Your Professor&apos;s analysis isn&apos;t ready yet. Your submission is saved; check back later.</p> : null}
    {feedback.status === "ready" && result ? <ResultDialog popUp={popUp} label="AI feedback"><div className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary) [&_dl]:mt-3 [&_dl]:grid [&_dl]:grid-cols-[minmax(90px,.8fr)_minmax(0,1.2fr)] [&_dl]:gap-x-3 [&_dl]:gap-y-[7px] [&_dt]:text-(--text-muted) [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere]">
      <AnalysisFindings state={result.state} labels={result.labels} findings={result.findings} possibleFindings={result.possibleFindings} idPrefix="activity" />
      <details className="mt-[18px] border-t border-t-(--border-subtle) pt-3.5"><summary className="cursor-pointer font-extrabold">Release and execution provenance</summary><dl><dt>Model release</dt><dd>{result.provenance.releaseId}</dd><dt>Preprocessing</dt><dd>{result.provenance.preprocessingVersion}</dd><dt>Thresholds</dt><dd>{result.provenance.thresholdVersion}</dd><dt>Provider</dt><dd>{result.provenance.executionProvider.toUpperCase()}</dd><dt>Model SHA-256</dt><dd>{result.provenance.modelSha256}</dd><dt>Bundle SHA-256</dt><dd>{result.provenance.bundleSha256}</dd><dt>Application build</dt><dd>{result.provenance.applicationBuild}</dd></dl></details>
      <AttentionHeatmap imageUrl={imageUrl} attention={result.attention ?? { status: "unavailable", reason: "legacy-model-release" }} labels={result.labels} title="AI finding heatmap" />
    </div></ResultDialog> : null}
  </section>;
}
