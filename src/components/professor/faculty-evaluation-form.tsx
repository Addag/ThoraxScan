"use client";

import { useActionState, useState } from "react";
import { initialEvaluationState, type EvaluationActionState, type ProfessorEvaluation } from "@/lib/evaluations/types";

import { reviewButtonGradient, reviewButtonOutline, reviewButtonSolid, reviewFieldClass, reviewFieldLabelClass, reviewPanelTextClass, reviewTextareaClass } from "./review-styles";

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
  return <section className="text-[#f6f8ff]" aria-labelledby="faculty-review-heading">
    <h2 id="faculty-review-heading">Grading</h2>
    <p className={reviewPanelTextClass} role="status" aria-live="polite">{pending ? "Saving evaluation…" : state.message || (evaluation?.status === "released" ? "Released · permanently locked" : evaluation ? "Draft · visible to Professors only" : "Unreviewed")}</p>
    {evaluation?.released_at ? <p className={reviewPanelTextClass}>Released <time dateTime={evaluation.released_at}>{new Date(evaluation.released_at).toLocaleString()}</time></p> : null}
    <form className="min-w-0" action={action}>
      <fieldset className="m-0 grid min-w-0 gap-[9px] border-0 p-0" disabled={pending || locked}>
        <legend className="mb-[3px] p-0 text-[13px] font-extrabold text-white">Score and feedback</legend>
        <label className={reviewFieldLabelClass} htmlFor="evaluation-score">Score (%)</label>
        <input className={reviewFieldClass} id="evaluation-score" name="score" inputMode="decimal" value={score} onChange={event => setScore(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.score)} aria-describedby={state.fieldErrors?.score ? "evaluation-score-error" : undefined} />
        {state.fieldErrors?.score ? <p id="evaluation-score-error" role="alert">{state.fieldErrors.score}</p> : null}
        <label className={reviewFieldLabelClass} htmlFor="evaluation-remarks">Private remarks (Professors only)</label>
        <textarea className={reviewTextareaClass} id="evaluation-remarks" name="remarks" rows={4} value={remarks} onChange={event => setRemarks(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.remarks)} aria-describedby={state.fieldErrors?.remarks ? "evaluation-remarks-error" : undefined} />
        {state.fieldErrors?.remarks ? <p id="evaluation-remarks-error" role="alert">{state.fieldErrors.remarks}</p> : null}
        <label className={reviewFieldLabelClass} htmlFor="evaluation-feedback">Student feedback</label>
        <textarea className={reviewTextareaClass} id="evaluation-feedback" name="feedback" rows={6} value={feedback} onChange={event => setFeedback(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.feedback)} aria-describedby="evaluation-feedback-help evaluation-feedback-error" />
        <p id="evaluation-feedback-help">Up to 5,000 characters per text field. Feedback is required for release and becomes visible to the Student while the activity is published.</p>
        <p id="evaluation-feedback-error" role={state.fieldErrors?.feedback ? "alert" : undefined}>{state.fieldErrors?.feedback}</p>
        {!locked ? <div className="mt-[5px] flex flex-wrap gap-[9px]">
          <button className={reviewButtonSolid} type="submit" name="intent" value="draft">Save Review</button>
          <button className={reviewButtonGradient} type="button" onClick={() => setConfirming(true)}>Release evaluation</button>
        </div> : null}
        {confirming && !locked ? <div className="mt-[5px] grid gap-2.5 rounded-lg border border-[rgb(255_211_106/45%)] bg-[rgb(73_55_18/32%)] p-3.5" role="group" aria-labelledby="release-confirmation">
          <p className="m-0 text-[12px] leading-[1.5] text-[#ffe3a0]" id="release-confirmation">Release is permanent. The score and feedback cannot be changed after release.</p>
          <input className={reviewFieldClass} type="hidden" name="confirmed" value="yes" />
          <div className="flex flex-wrap gap-[9px]">
            <button className={reviewButtonOutline} type="button" onClick={() => setConfirming(false)}>Keep editing</button>
            <button className={reviewButtonGradient} type="submit" name="intent" value="release">Confirm and release</button>
          </div>
        </div> : null}
      </fieldset>
    </form>
  </section>;
}
