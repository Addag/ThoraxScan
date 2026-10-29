"use client";

import { useActionState, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { initialEvaluationState, type EvaluationActionState, type ProfessorEvaluation } from "@/lib/evaluations/types";

import { button, field, textarea } from "@/components/controls";

const labelClass = "grid gap-1.5 text-[0.8125rem] text-(--text-muted)";
const textClass = "mx-0 mt-0 mb-3 text-[0.8125rem] leading-[1.5] text-(--text-muted)";
const lockable = "disabled:cursor-default";
const fieldClass = `${field} ${lockable}`;
const textareaClass = `${textarea} min-h-[110px] ${lockable} field-sizing-content`;

type Action = (previous: EvaluationActionState, data: FormData) => Promise<EvaluationActionState>;
export function FacultyEvaluationForm({ evaluation, saveAction, releaseAction }: {
  evaluation: ProfessorEvaluation | null; saveAction: Action; releaseAction: Action;
}) {
  const [confirming, setConfirming] = useState(false);
  const [score, setScore] = useState(evaluation?.score?.toFixed(2) ?? "");
  const [remarks, setRemarks] = useState(evaluation?.remarks ?? "");
  const [feedback, setFeedback] = useState(evaluation?.feedback ?? "");
  const [state, action, pending] = useActionState(async (previous: EvaluationActionState, data: FormData) => {
    const result = data.get("intent") === "release" ? await releaseAction(previous, data) : await saveAction(previous, data);
    setConfirming(false);
    return result;
  }, initialEvaluationState);
  const locked = evaluation?.status === "released" || ["released", "already_released", "unauthorized", "unavailable"].includes(state.status);
  return <section className="p-4 text-(--text-primary)" aria-labelledby="faculty-review-heading">
    <h2 id="faculty-review-heading">Grading</h2>
    <p className={textClass} role="status" aria-live="polite">{pending ? "Saving evaluation…" : state.message || (evaluation?.status === "released" ? "Released · permanently locked" : evaluation ? "Draft · visible to Professors only" : "Unreviewed")}</p>
    {evaluation?.released_at ? <p className={textClass}>Released <time dateTime={evaluation.released_at}>{new Date(evaluation.released_at).toLocaleString()}</time></p> : null}
    <form className="min-w-0" action={action}>
      <fieldset className="m-0 grid min-w-0 gap-[9px] border-0 p-0" disabled={pending || locked}>
        <legend className="mb-[3px] p-0 text-[0.875rem] font-extrabold text-(--text-primary)">Score and feedback</legend>
        <label className={labelClass} htmlFor="evaluation-score">Score (%)</label>
        <input className={fieldClass} id="evaluation-score" name="score" inputMode="decimal" value={score} onChange={event => setScore(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.score)} aria-describedby={state.fieldErrors?.score ? "evaluation-score-error" : undefined} />
        {state.fieldErrors?.score ? <p className="m-0 text-[0.8125rem]" id="evaluation-score-error" role="alert">{state.fieldErrors.score}</p> : null}
        <label className={labelClass} htmlFor="evaluation-remarks">Private remarks (Professors only)</label>
        <textarea className={textareaClass} id="evaluation-remarks" name="remarks" rows={4} value={remarks} onChange={event => setRemarks(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.remarks)} aria-describedby={state.fieldErrors?.remarks ? "evaluation-remarks-error" : undefined} />
        {state.fieldErrors?.remarks ? <p className="m-0 text-[0.8125rem]" id="evaluation-remarks-error" role="alert">{state.fieldErrors.remarks}</p> : null}
        <label className={labelClass} htmlFor="evaluation-feedback">Student feedback</label>
        <textarea className={textareaClass} id="evaluation-feedback" name="feedback" rows={6} value={feedback} onChange={event => setFeedback(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.feedback)} aria-describedby="evaluation-feedback-help evaluation-feedback-error" />
        <p className="m-0 text-[0.8125rem] text-(--text-muted)" id="evaluation-feedback-help">Up to 5,000 characters per text field. Feedback is required for release and becomes visible to the Student while the activity is published.</p>
        <p className="m-0 text-[0.8125rem]" id="evaluation-feedback-error" role={state.fieldErrors?.feedback ? "alert" : undefined}>{state.fieldErrors?.feedback}</p>
        {!locked ? <div className="mt-[5px] flex flex-wrap gap-[9px]">
          <button className={button("secondary")} type="submit" name="intent" value="draft">Save Review</button>
          <button className={button("primary")} type="button" onClick={() => setConfirming(true)}>Release evaluation</button>
        </div> : null}
        {confirming && !locked ? <ConfirmDialog title="Release evaluation?" cancelLabel="Keep editing" confirmLabel="Confirm and release" name="intent" value="release" onClose={() => setConfirming(false)}>
          Release is permanent. The score and feedback cannot be changed after release.
          <input type="hidden" name="confirmed" value="yes" />
        </ConfirmDialog> : null}
      </fieldset>
    </form>
  </section>;
}
