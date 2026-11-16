"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAnswerKeyAction } from "@/app/(protected)/professor/activities/actions";
import type { ProfessorActivityDetails } from "@/lib/activities/types";
import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { CAM_CELLS, CAM_GRID, UNAVAILABLE_ATTENTION, readyClassActivation } from "@/lib/inference/attention";
import { aiAccuracy, labelsError, toggleLabel } from "@/lib/submissions/validation";
import { AttentionHeatmap, drawOverlay } from "@/components/attention-heatmap";
import { button } from "@/components/controls";
import { ActivityPanelTitle } from "@/components/activities/activity-ui";
import { activityFormMessageClass } from "@/components/activities/activity-form-styles";

const panelClass = "overflow-hidden rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow)";
const textClass = "m-0 text-caption leading-normal text-(--text-secondary)";
const tagClass = "rounded-full border border-(--border-strong) px-2 py-0.5 text-label text-(--text-muted)";

/**
 * The Professor's validation of a draft's AI result: tick the true labels, repaint the per-label heatmaps,
 * and save. The saved key is what Students are scored against and shown, and it locks at publication.
 */
export function AnswerKeyForm({ activity }: { activity: ProfessorActivityDetails }) {
  const router = useRouter();
  const aiFindings = activity.aiFindings ?? [];
  const [labels, setLabels] = useState<ActivityAILabel[]>(activity.validatedLabels ?? aiFindings);
  const [heatmap, setHeatmap] = useState<number[] | null>(activity.validatedHeatmap ?? activity.aiHeatmap);
  const [editing, setEditing] = useState<ActivityAILabel | null>(null);
  const [erase, setErase] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [dirty, setDirty] = useState(activity.validatedLabels === null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const title = <ActivityPanelTitle icon="✓" title="Validate the AI result" titleId="answer-key-title" />;
  if (activity.status !== "draft") {
    if (!activity.validatedLabels) return null;
    return <section className={panelClass} aria-labelledby="answer-key-title">
      <ActivityPanelTitle icon="✓" title="Answer key" titleId="answer-key-title" />
      <div className="grid gap-3 px-4 py-3.5">
        <p className={textClass}>Students are scored against these labels and see them, with the heatmaps, after submitting. The key is locked because the activity is published.</p>
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
  const paintable: ActivityAILabel[] = labels.filter((label) => label !== "No Finding");
  const current = editing && paintable.includes(editing) ? editing : paintable[0] ?? null;
  const offset = current ? ACTIVITY_AI_LABELS.indexOf(current) * CAM_CELLS : 0;
  const setCell = (cell: number, value: number) => {
    if (!heatmap || heatmap[offset + cell] === value) return;
    const next = [...heatmap];
    next[offset + cell] = value;
    setHeatmap(next);
    edited();
  };
  const paint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = (position: number, size: number) => Math.min(CAM_GRID - 1, Math.max(0, Math.floor((position / size) * CAM_GRID)));
    const cell = at(event.clientY - box.top, box.height) * CAM_GRID + at(event.clientX - box.left, box.width);
    setCursor(cell);
    setCell(cell, erase ? 0 : 1);
  };
  // Keyboard painting: arrows move the outlined cell, Space or Enter paints it with the current brush.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -CAM_GRID, ArrowDown: CAM_GRID }[event.key];
    if (step !== undefined) {
      setCursor((cell) => {
        const next = cell + step;
        const sameRow = Math.abs(step) !== 1 || Math.floor(next / CAM_GRID) === Math.floor(cell / CAM_GRID);
        return sameRow && next >= 0 && next < CAM_CELLS ? next : cell;
      });
    } else if (event.key === " " || event.key === "Enter") setCell(cursor, erase ? 0 : 1);
    else return;
    event.preventDefault();
  };
  const error = labelsError(labels);
  const save = () => startSaving(async () => {
    const saved = await saveAnswerKeyAction(activity.id, labels, heatmap);
    setResult(saved);
    if (saved.ok) { setDirty(false); router.refresh(); }
  });

  return <section className={panelClass} aria-labelledby="answer-key-title">{title}
    <div className="grid gap-3.5 px-4 py-3.5">
      <p className={textClass}>Tick every label that is truly present. The AI&apos;s findings are pre-ticked; add what it missed and untick what it got wrong. Students are scored against what you save here.</p>
      <fieldset className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 border-0 p-0 max-[520px]:grid-cols-1" disabled={saving}>
        <legend className="mb-2 p-0 text-small font-semibold text-(--text-primary)">True labels</legend>
        {ACTIVITY_AI_LABELS.map((label) => <label className="flex items-center gap-2 text-small text-(--text-secondary)" key={label}>
          <input className="size-4 accent-brand" type="checkbox" checked={labels.includes(label)} onChange={() => { setLabels(toggleLabel(labels, label)); edited(); }} />
          {label}{aiFindings.includes(label) ? <span className={tagClass}>AI</span> : null}
        </label>)}
      </fieldset>
      <p className={textClass} role="status">{error ?? <>AI matched <strong>{aiAccuracy(aiFindings, labels)}</strong> of the labels you ticked.</>}</p>

      {heatmap && current ? <div className="grid gap-2.5 border-t border-(--border-subtle) pt-3.5">
        <h3 className="m-0 text-small font-semibold text-(--text-primary)">Edit the heatmaps</h3>
        <p className={textClass}>Each ticked finding has its own heatmap, starting from the AI&apos;s. Drag over the X-ray to mark where the finding is, or erase where the AI was wrong.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-(--text-secondary)">
          <label className="flex items-center gap-[7px]">Finding
            <select className="min-h-[32px] max-w-full rounded-control border border-(--border-strong) bg-(--surface-sunken) px-[10px] text-caption text-(--text-primary)" value={current} onChange={(event) => setEditing(event.target.value as ActivityAILabel)}>
              {paintable.map((label) => <option key={label} value={label}>{label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-[7px]"><input className="size-[15px] accent-brand" type="radio" name="answer-key-brush" checked={!erase} onChange={() => setErase(false)} /> Mark</label>
          <label className="flex items-center gap-[7px]"><input className="size-[15px] accent-brand" type="radio" name="answer-key-brush" checked={erase} onChange={() => setErase(true)} /> Erase</label>
          <button className={button("secondary")} type="button" disabled={!activity.aiHeatmap} onClick={() => {
            const next = [...heatmap];
            next.splice(offset, CAM_CELLS, ...activity.aiHeatmap!.slice(offset, offset + CAM_CELLS));
            setHeatmap(next);
            edited();
          }}>Reset to AI</button>
        </div>
        {activity.imageUrl ? <div style={{ position: "relative", maxWidth: 448 }}>
          {/* Native image keeps the private signed URL out of an image proxy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activity.imageUrl} alt="Chest X-ray being validated" style={{ display: "block", width: "100%", filter: "grayscale(1)" }} />
          <canvas width={112} height={112} tabIndex={0} role="application"
            aria-label={`Heatmap painter for ${current}. Drag to paint, or use the arrow keys to move and Space to paint a cell.`}
            ref={(canvas) => drawOverlay(canvas, heatmap.slice(offset, offset + CAM_CELLS), CAM_GRID)}
            onPointerDown={(event) => { paint(event); event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={(event) => { if (event.buttons & 1) paint(event); }}
            onKeyDown={onKeyDown}
            className="peer cursor-crosshair"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55, touchAction: "none" }} />
          <span aria-hidden="true" className="pointer-events-none absolute hidden border-2 border-white peer-focus-visible:block"
            style={{ left: `${((cursor % CAM_GRID) * 100) / CAM_GRID}%`, top: `${(Math.floor(cursor / CAM_GRID) * 100) / CAM_GRID}%`, width: `${100 / CAM_GRID}%`, height: `${100 / CAM_GRID}%` }} />
        </div> : <p className={textClass}>The case image is unavailable. Reload to edit the heatmaps.</p>}
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
