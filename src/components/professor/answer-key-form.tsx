"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAnswerKeyAction } from "@/app/(protected)/professor/activities/actions";
import type { ProfessorActivityDetails } from "@/lib/activities/types";
import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { UNAVAILABLE_ATTENTION, readyClassActivation } from "@/lib/inference/attention";
import { aiAccuracy, labelsError, toggleLabel } from "@/lib/submissions/validation";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { HeatmapPainter } from "@/components/heatmap-painter";
import { button } from "@/components/controls";
import { ActivityPanelTitle } from "@/components/activities/activity-ui";
import { activityFormMessageClass } from "@/components/activities/activity-form-styles";

const panelClass = "overflow-hidden rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow)";
const textClass = "m-0 text-caption leading-normal text-(--text-secondary)";
const tagClass = "rounded-full border border-(--border-strong) px-2 py-0.5 text-label text-(--text-muted)";

/**
 * The Professor's validation of a draft's AI result: tick the true labels, repaint the per-label heatmaps,
 * and save. Students see the saved key after submitting, the Professor grades against it, and it locks at publication.
 */
export function AnswerKeyForm({ activity }: { activity: ProfessorActivityDetails }) {
  const router = useRouter();
  const aiFindings = activity.aiFindings ?? [];
  const [labels, setLabels] = useState<ActivityAILabel[]>(activity.validatedLabels ?? aiFindings);
  const [heatmap, setHeatmap] = useState<number[] | null>(activity.validatedHeatmap ?? activity.aiHeatmap);
  const [dirty, setDirty] = useState(activity.validatedLabels === null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const title = <ActivityPanelTitle icon="✓" title="Validate the AI result" titleId="answer-key-title" />;
  if (activity.status !== "draft") {
    if (!activity.validatedLabels) return null;
    return <section className={panelClass} aria-labelledby="answer-key-title">
      <ActivityPanelTitle icon="✓" title="Answer key" titleId="answer-key-title" />
      <div className="grid gap-3 px-4 py-3.5">
        <p className={textClass}>Students see these labels and heatmaps after submitting, next to their own answer, and you grade against them. The key is locked because the activity is published.</p>
        <LabelTags labels={activity.validatedLabels} aiFindings={aiFindings} />
        {activity.aiFindings ? <p className={textClass}>AI matched <strong>{aiAccuracy(aiFindings, activity.validatedLabels)}</strong> of the validated labels.</p> : null}
        <AttentionHeatmap imageUrl={activity.imageUrl} attention={activity.validatedHeatmap ? readyClassActivation(activity.validatedHeatmap) : UNAVAILABLE_ATTENTION} findings={activity.validatedLabels} title="Validated heatmap" />
      </div>
    </section>;
  }
  if (!activity.aiFindings) {
    return <section className={panelClass} aria-labelledby="answer-key-title">{title}
      <p className={`${textClass} px-4 py-3.5`}>Upload a case and wait for the AI analysis. Its result appears here for you to validate before publishing.</p>
    </section>;
  }

  const edited = () => { setDirty(true); setResult(null); };
  const error = labelsError(labels);
  const save = () => startSaving(async () => {
    const saved = await saveAnswerKeyAction(activity.id, labels, heatmap);
    setResult(saved);
    if (saved.ok) { setDirty(false); router.refresh(); }
  });

  return <section className={panelClass} aria-labelledby="answer-key-title">{title}
    <div className="grid gap-3.5 px-4 py-3.5">
      <p className={textClass}>Tick every label that is truly present. The AI&apos;s findings are pre-ticked; add what it missed and untick what it got wrong. Students see what you save here after submitting, next to their own answer.</p>
      <fieldset className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 border-0 p-0 max-[520px]:grid-cols-1" disabled={saving}>
        <legend className="mb-2 p-0 text-small font-semibold text-(--text-primary)">True labels</legend>
        {ACTIVITY_AI_LABELS.map((label) => <label className="flex items-center gap-2 text-small text-(--text-secondary)" key={label}>
          <input className="size-4 accent-brand" type="checkbox" checked={labels.includes(label)} onChange={() => { setLabels(toggleLabel(labels, label)); edited(); }} />
          {label}{aiFindings.includes(label) ? <span className={tagClass}>AI</span> : null}
        </label>)}
      </fieldset>
      <p className={textClass} role="status">{error ?? <>AI matched <strong>{aiAccuracy(aiFindings, labels)}</strong> of the labels you ticked.</>}</p>

      {heatmap && labels.some((label) => label !== "No Finding") ? <div className="grid gap-2.5 border-t border-(--border-subtle) pt-3.5">
        <h3 className="m-0 text-small font-semibold text-(--text-primary)">Edit the heatmaps</h3>
        <p className={textClass}>Each ticked finding has its own heatmap, starting from the AI&apos;s. Drag over the X-ray to mark where the finding is, or erase where the AI was wrong. Adjust the brush size, strength and hardness, and undo any stroke.</p>
        <HeatmapPainter imageUrl={activity.imageUrl} labels={labels} values={heatmap} onChange={(next) => { setHeatmap(next); edited(); }} resetTo={activity.aiHeatmap} disabled={saving} />
      </div> : null}

      <button className={`${button("primary")} w-full`} type="button" disabled={saving || Boolean(error) || !dirty} onClick={save}>
        {saving ? "Saving…" : dirty ? "Save answer key" : "Answer key saved"}
      </button>
      {result ? <p className={activityFormMessageClass(result.ok ? "success" : "error")} role="status">{result.message}</p> : null}
    </div>
  </section>;
}

export function LabelTags({ labels, aiFindings }: { labels: readonly string[]; aiFindings: readonly string[] }) {
  return <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{labels.map((label) => <li className="flex items-center gap-2 rounded-control border border-(--border-subtle) px-2.5 py-1.5 text-small text-(--text-primary)" key={label}>
    {label}<span className={tagClass}>{aiFindings.includes(label) ? "AI found" : "Added by Professor"}</span>
  </li>)}</ul>;
}
