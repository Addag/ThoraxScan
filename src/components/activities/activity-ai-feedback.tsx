"use client";

import { useState } from "react";
import type { ActivityAIFeedback } from "@/lib/activity-ai/types";
import { scoreLabels } from "@/lib/submissions/validation";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { ResultDialog } from "@/components/result-dialog";
import { ActivityPanelTitle } from "@/components/activities/activity-ui";

const textClass = "m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary)";
const rowClass = "flex flex-wrap items-center justify-between gap-2 rounded-control border border-(--border-subtle) px-3 py-2.5 text-small";
const tagClass = "rounded-full border border-(--border-strong) px-2 py-0.5 text-label text-(--text-muted)";

/**
 * A Student's results after a final submission: the Professor-validated answer key, how the Student's
 * selected labels compare with it, and the validated heatmaps. Read-only; the key is set by the Professor.
 */
export function ActivityAIFeedback({ imageUrl, initial: feedback, selected, labelScore }: { imageUrl: string | null; initial: ActivityAIFeedback; selected: readonly string[]; labelScore: number | null }) {
  // Pops up only when the result arrives during this visit, not every time a finished activity is reopened.
  const [popUp] = useState(feedback.status !== "ready");
  const result = feedback.result;
  const key = result?.validatedLabels;
  const match = key ? scoreLabels(selected, key) : null;
  const aiFound = new Set<string>(result?.findings.map((finding) => finding.label));
  return <section className="overflow-hidden rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow)" aria-labelledby="activity-ai-feedback-title">
    <ActivityPanelTitle icon="✦" title="Results" titleId="activity-ai-feedback-title" />
    {feedback.status === "locked" ? <p className={textClass}>Submit your final evaluation to see the correct labels, your score, and the validated heatmap.</p> : null}
    {feedback.status === "pending" || feedback.status === "failed" ? <p role="status" className={textClass}>The results for this activity aren&apos;t ready yet. Your submission is saved; check back later.</p> : null}
    {feedback.status === "ready" && result && !(key && match) ? <p className={textClass}>This activity was published before answer keys existed, so it has no results to show.</p> : null}
    {feedback.status === "ready" && result && key && match ? <ResultDialog popUp={popUp} label="Results"><div className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary) [&_dl]:mt-3 [&_dl]:grid [&_dl]:grid-cols-[minmax(90px,.8fr)_minmax(0,1.2fr)] [&_dl]:gap-x-3 [&_dl]:gap-y-[7px] [&_dt]:text-(--text-muted) [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere]">
      <section aria-labelledby="activity-score-title">
        <h3 className="m-0 text-lead font-extrabold text-(--text-primary)" id="activity-score-title">Label score</h3>
        <p className="mx-0 mt-1.5 mb-0 text-[2rem] leading-none font-extrabold text-(--text-primary)">{(labelScore ?? match.score).toFixed(2)}%</p>
        <p className="mx-0 mt-2 mb-0">You selected {match.correct.length} of {key.length} correct label{key.length === 1 ? "" : "s"}{match.extra.length ? `, plus ${match.extra.length} that ${match.extra.length === 1 ? "is" : "are"} not present` : ""}. This is half of your grade; your Professor&apos;s evaluation is the other half.</p>
      </section>
      <section className="mt-5" aria-labelledby="activity-key-title">
        <h3 className="mb-1 text-lead font-extrabold text-(--text-primary)" id="activity-key-title">Correct labels</h3>
        <p className="mb-3">Validated by your Professor, starting from the AI&apos;s result.</p>
        <ul className="m-0 grid list-none gap-2 p-0">
          {key.map((label) => <li className={rowClass} key={label}>
            <span className="text-(--text-primary)"><span aria-hidden="true">{selected.includes(label) ? "✓ " : "✗ "}</span><strong>{label}</strong> · {selected.includes(label) ? "You selected this" : "You missed this"}</span>
            <span className={tagClass}>{aiFound.has(label) ? "AI found" : "Added by Professor"}</span>
          </li>)}
          {match.extra.map((label) => <li className={rowClass} key={label}>
            <span className="text-(--status-warning-text)"><span aria-hidden="true">✗ </span><strong>{label}</strong> · You selected this, but it is not present</span>
          </li>)}
        </ul>
      </section>
      <div className="mt-5"><AttentionHeatmap imageUrl={imageUrl} attention={result.attention ?? { status: "unavailable", reason: "legacy-model-release" }} findings={key} title="Validated heatmap" /></div>
      <details className="mt-[18px] border-t border-t-(--border-subtle) pt-3.5"><summary className="cursor-pointer font-extrabold">AI release and execution provenance</summary><dl><dt>Model release</dt><dd>{result.provenance.releaseId}</dd><dt>Preprocessing</dt><dd>{result.provenance.preprocessingVersion}</dd><dt>Thresholds</dt><dd>{result.provenance.thresholdVersion}</dd><dt>Provider</dt><dd>{result.provenance.executionProvider.toUpperCase()}</dd><dt>Model SHA-256</dt><dd>{result.provenance.modelSha256}</dd><dt>Bundle SHA-256</dt><dd>{result.provenance.bundleSha256}</dd><dt>Application build</dt><dd>{result.provenance.applicationBuild}</dd></dl></details>
    </div></ResultDialog> : null}
  </section>;
}
