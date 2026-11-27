"use client";

import { useActionState, useEffect, useState } from "react";
import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { initialSubmissionState, type LabelAnswers, type StudentSubmission, type SubmissionActionState } from "@/lib/submissions/types";
import { ANSWER_LIMIT, HEATMAP_LENGTH, labelsError, paintedLabels, toggleLabel, unpaintedFindings } from "@/lib/submissions/validation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button, textarea } from "@/components/controls";
import { HeatmapPainter } from "@/components/heatmap-painter";
import { activityFormHeadingClass, activityFormHeadingIconClass, activityFormHeadingKickerClass, activityFormHeadingTitleClass } from "@/components/activities/activity-form-styles";

const EMPTY_MAP: number[] = Array(HEATMAP_LENGTH).fill(0);
const hintClass = "text-caption text-(--text-muted)";
const errorClass = "text-caption text-(--status-error-text)";

export function StudentSubmissionForm({ submission, imageUrl, heatmapRequired, dueAt, deadlinePassed, action }: {
  submission: StudentSubmission | null;
  imageUrl: string | null;
  // True when the answer key has per-finding maps, so every selected finding needs a marked cell to submit.
  heatmapRequired: boolean;
  dueAt: string | null;
  deadlinePassed: boolean;
  action: (previous: SubmissionActionState, data: FormData) => Promise<SubmissionActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialSubmissionState);
  const [labels, setLabels] = useState<ActivityAILabel[]>(submission?.labels ?? []);
  const [answers, setAnswers] = useState<LabelAnswers>(submission?.answers ?? {});
  const [heatmap, setHeatmap] = useState<number[] | null>(submission?.heatmap ?? null);
  const [confirming, setConfirming] = useState(false);
  const [incomplete, setIncomplete] = useState<string | null>(null);
  const edited = () => { setConfirming(false); setIncomplete(null); };
  // Same rules the server applies, so an unfinished answer is caught before the confirmation opens.
  const startFinal = () => {
    const missing = heatmapRequired ? unpaintedFindings(heatmap, labels) : [];
    const problem = labelsError(labels) ?? (missing.length ? `Mark where each finding is on the heatmap before submitting: ${missing.join(", ")}.` : null);
    if (problem) setIncomplete(problem); else setConfirming(true);
  };
  const [expired, setExpired] = useState(deadlinePassed);
  useEffect(() => {
    if (!dueAt) return;
    const check = () => { if (Date.now() >= new Date(dueAt).getTime()) setExpired(true); };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [dueAt]);
  const submitted = submission?.status === "submitted" || state.status === "submitted" || state.status === "already_submitted";
  const closed = expired || state.status === "deadline_passed";
  const locked = submitted || closed || state.status === "unauthorized" || state.status === "unavailable";
  const errors = state.fieldErrors;
  const message = pending ? "Saving your response…"
    : submitted ? state.message || "Submitted · This response is permanently locked."
    : closed ? "Deadline passed · Not submitted. Your draft is read-only."
    : state.message || (submission ? "Draft · Not submitted. Save changes or submit your final evaluation." : "Not started · Save a private draft or submit your final evaluation.");
  const lockedLabels = submission?.labels.length ? submission.labels : labels;
  const lockedAnswers = submission?.labels.length ? submission.answers : answers;
  const findings = labels.filter((label) => label !== "No Finding");
  const painted = paintedLabels(heatmap, labels);
  // Only selected findings' maps are sent, so unticking a finding drops what was painted for it.
  const sentMap = painted.length && heatmap ? heatmap.map((value, cell) => painted.includes(ACTIVITY_AI_LABELS[Math.floor(cell / 196)]) ? value : 0) : null;
  return <section className="rounded-panel border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-6 max-[520px]:p-5">
    <div className={activityFormHeadingClass}><span className={activityFormHeadingIconClass} aria-hidden="true">➤</span><div><p className={activityFormHeadingKickerClass}>Student response</p><h2 className={activityFormHeadingTitleClass}>Your evaluation</h2></div></div>
    <p className="my-3 text-small leading-normal" role="status" aria-live="polite">{message}</p>
    {submission?.submittedAt ? <p className="my-3 text-small leading-normal">Submitted <time dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString()}</time></p> : null}
    {locked ? <div className="[overflow-wrap:anywhere]">
      <h3 className="m-0 text-small font-semibold">Labels you selected</h3>
      {lockedLabels.length ? <dl className="mx-0 mt-1 mb-0 grid gap-2 text-small">{lockedLabels.map((label) => <div key={label}>
        <dt className="font-semibold">{label}</dt>
        <dd className="mx-0 mt-0.5 mb-0 whitespace-pre-wrap text-(--text-secondary)">{lockedAnswers[label] || "No written answer"}</dd>
      </div>)}</dl> : <p className="mx-0 mt-1 mb-0 text-small">No labels selected</p>}
    </div> : <form action={formAction}>
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-3 border-0 p-0">
        {/* React resets the form after each save, which clears controlled fields. Remounting them when the save settles makes the current state their reset default. */}
        <div key={pending ? "saving" : "idle"} className="grid min-w-0 gap-3">
          <fieldset className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 border-0 p-0 max-[520px]:grid-cols-1 aria-invalid:outline-2 aria-invalid:outline-(--status-error-text)" aria-describedby={errors?.labels ? "labels-error" : "labels-hint"} aria-invalid={Boolean(errors?.labels)}>
            <legend className="mb-2 p-0 text-small text-(--text-secondary)">Which findings are present in this X-ray?</legend>
            {ACTIVITY_AI_LABELS.map((label) => <label className="flex items-center gap-2 text-small text-(--text-secondary)" key={label}>
              <input className="size-4 accent-brand" type="checkbox" name="labels" value={label} checked={labels.includes(label)} onChange={() => { setLabels(toggleLabel(labels, label)); edited(); }} />{label}
            </label>)}
          </fieldset>
          <small className={hintClass} id="labels-hint">Select every finding you see. Choose No Finding on its own for a normal X-ray.</small>
          {errors?.labels ? <small className={errorClass} id="labels-error" role="alert">{errors.labels}</small> : null}

          {labels.length ? <fieldset className="m-0 grid gap-3 border-0 border-t border-(--border-subtle) p-0 pt-3">
            <legend className="float-left mb-1 w-full p-0 pt-3 text-small text-(--text-secondary)">Explain your answer <span className="text-(--text-muted)">(optional)</span></legend>
            {labels.map((label) => <label className="grid gap-1.5 text-small text-(--text-secondary)" key={label}>
              {label === "No Finding" ? "Why do you think this X-ray is normal?" : `What do you see for ${label}?`}
              <textarea className={textarea} name={`answer:${label}`} rows={3} maxLength={ANSWER_LIMIT} value={answers[label] ?? ""}
                onChange={(event) => { setAnswers({ ...answers, [label]: event.target.value }); edited(); }} />
            </label>)}
            {errors?.answers ? <small className={errorClass} role="alert">{errors.answers}</small> : null}
          </fieldset> : null}

          {findings.length ? <div className="grid gap-2.5 border-t border-(--border-subtle) pt-3">
            <h3 className="m-0 text-small font-semibold text-(--text-primary)">Mark where each finding is</h3>
            <p className={hintClass} id="heatmap-hint">Pick a finding, then drag over the X-ray to mark where you see it. Adjust the brush size, strength and hardness, switch to Erase, or undo a stroke.{heatmapRequired ? " Each finding needs at least one marked area before you submit." : ""} After submitting, you will see your marks next to your Professor&apos;s.</p>
            <HeatmapPainter imageUrl={imageUrl} labels={findings} values={heatmap ?? EMPTY_MAP} onChange={(next) => { setHeatmap(next); edited(); }}
              describe={(label) => painted.includes(label) ? "marked" : "not marked yet"} />
            {errors?.heatmap ? <small className={errorClass} role="alert">{errors.heatmap}</small> : null}
          </div> : null}
          <input type="hidden" name="heatmap" value={sentMap ? JSON.stringify(sentMap) : ""} />
        </div>
        <div className="flex flex-wrap gap-4">
          <button className={button("secondary")} type="submit" name="intent" value="draft" onClick={edited}>Save draft</button>
          <button className={button("primary")} type="button" onClick={startFinal}>Submit final evaluation</button>
        </div>
        {incomplete ? <p className="m-0 rounded-control border border-(--status-error-text) px-3 py-2 text-small font-semibold text-(--status-error-text)" role="alert">{incomplete}</p> : null}
        {confirming ? <ConfirmDialog title="Confirm final submission" cancelLabel="Keep editing" confirmLabel="Confirm and submit" name="intent" value="final" onClose={() => setConfirming(false)}>
          Your final evaluation cannot be edited. Review your response before confirming.
          <input type="hidden" name="confirmed" value="yes" />
        </ConfirmDialog> : null}
      </fieldset>
    </form>}
  </section>;
}
