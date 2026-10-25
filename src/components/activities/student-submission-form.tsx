"use client";

import { useActionState, useEffect, useState } from "react";
import { initialSubmissionState, type StudentSubmission, type SubmissionActionState } from "@/lib/submissions/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { activityButton } from "@/components/activities/activity-button";
import { activityFormHeadingClass, activityFormHeadingIconClass, activityFormHeadingKickerClass, activityFormHeadingTitleClass } from "@/components/activities/activity-form-styles";

export function StudentSubmissionForm({ submission, dueAt, deadlinePassed, action }: {
  submission: StudentSubmission | null;
  dueAt: string | null;
  deadlinePassed: boolean;
  action: (previous: SubmissionActionState, data: FormData) => Promise<SubmissionActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialSubmissionState);
  const [findings, setFindings] = useState(submission?.visibleFindings ?? "");
  const [classification, setClassification] = useState(submission?.classification ?? "");
  const [region, setRegion] = useState(submission?.relevantRegion ?? "");
  const [confirming, setConfirming] = useState(false);
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
  const fieldError = (field: "visibleFindings" | "classification" | "relevantRegion") => errors?.[field] ? <small className="text-[0.75rem] text-[#ff7c85] light:text-(--status-error-text)" id={`${field}-error`} role="alert">{errors[field]}</small> : null;
  return <section className="rounded-[10px] border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-[22px] max-[520px]:p-[17px]">
    <div className={activityFormHeadingClass}><span className={activityFormHeadingIconClass} aria-hidden="true">➤</span><div><p className={activityFormHeadingKickerClass}>Student response</p><h2 className={activityFormHeadingTitleClass}>Your Evaluation</h2></div></div>
    <p className="my-3 text-[0.8125rem] leading-[1.5]" role="status" aria-live="polite">{message}</p>
    {submission?.submittedAt ? <p className="my-3 text-[0.8125rem] leading-[1.5]">Submitted <time dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString()}</time></p> : null}
    {locked ? <dl className="grid gap-4 [overflow-wrap:anywhere]">
      <div><dt className="font-semibold">Visible findings</dt><dd className="mx-0 mt-1 mb-0 whitespace-pre-wrap">{submission?.visibleFindings || findings || "No findings entered"}</dd></div>
      <div><dt className="font-semibold">Classification</dt><dd className="mx-0 mt-1 mb-0 whitespace-pre-wrap">{submission?.classification || classification || "Not selected"}</dd></div>
      {(submission?.classification || classification) === "abnormal" ? <div><dt className="font-semibold">Relevant region</dt><dd className="mx-0 mt-1 mb-0 whitespace-pre-wrap">{submission?.relevantRegion || region || "Not entered"}</dd></div> : null}
    </dl> : <form action={formAction}>
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-3 border-0 p-0 [&>label]:text-[0.8125rem] [&>label]:text-[#d8e1f0] light:[&>label]:text-(--text-secondary) [&_legend]:text-[0.8125rem] [&_legend]:text-[#d8e1f0] light:[&_legend]:text-(--text-secondary) [&>small]:text-[0.75rem] [&>small]:text-[#aeb6c5] light:[&>small]:text-(--text-muted)">
        <label htmlFor="visibleFindings">What visible findings do you observe?</label>
        <textarea className="w-full resize-y rounded-[5px] border border-[#82878e] light:border-(--border-strong) bg-(--surface-raised) px-3 py-[11px] leading-[1.45] text-(--text-primary) disabled:opacity-[0.52] aria-invalid:outline-2 aria-invalid:outline-[#ff7c85] light:aria-invalid:outline-(--status-error-text)" id="visibleFindings" name="visibleFindings" rows={5} value={findings} onChange={(event) => { setFindings(event.target.value); setConfirming(false); }} aria-invalid={Boolean(errors?.visibleFindings)} aria-describedby={errors?.visibleFindings ? "visibleFindings-error" : undefined} />
        {fieldError("visibleFindings")}
        <fieldset className="border-0 p-0 aria-invalid:outline-2 aria-invalid:outline-[#ff7c85] light:aria-invalid:outline-(--status-error-text)" aria-describedby={errors?.classification ? "classification-error" : undefined} aria-invalid={Boolean(errors?.classification)}>
          <legend>Normal or abnormal?</legend>
          <div className="flex flex-wrap gap-4">{["normal", "abnormal"].map((value) => <label className="flex items-center gap-2" key={value}><input className="w-auto min-h-0 rounded-[5px] border border-[#82878e] light:border-(--border-strong) bg-(--surface-raised) p-0 text-(--text-primary)" type="radio" name="classification" value={value} checked={classification === value} onChange={() => { setClassification(value); if (value === "normal") setRegion(""); setConfirming(false); }} />{value === "normal" ? "Normal" : "Abnormal"}</label>)}</div>
        </fieldset>
        {fieldError("classification")}
        <label htmlFor="relevantRegion">Which region appears most relevant?</label>
        <input className="w-full min-h-[42px] rounded-[5px] border border-[#82878e] light:border-(--border-strong) bg-(--surface-raised) px-3 py-[11px] text-(--text-primary) disabled:opacity-[0.52] disabled:cursor-not-allowed aria-invalid:outline-2 aria-invalid:outline-[#ff7c85] light:aria-invalid:outline-(--status-error-text)" id="relevantRegion" name="relevantRegion" disabled={classification !== "abnormal"} value={region} onChange={(event) => { setRegion(event.target.value); setConfirming(false); }} aria-invalid={Boolean(errors?.relevantRegion)} aria-describedby={errors?.relevantRegion ? "relevantRegion-error" : "region-hint"} />
        <small className="text-[0.75rem] text-[#aeb6c5] light:text-(--text-muted)" id="region-hint">{classification === "abnormal" ? "Required for a final abnormal response." : "Select Abnormal to enter a region."} Maximum 200 characters.</small>
        {fieldError("relevantRegion")}
        <div className="flex flex-wrap gap-4">
          <button className={activityButton.secondary} type="submit" name="intent" value="draft" onClick={() => setConfirming(false)}>Save draft</button>
          <button className={activityButton.primary} type="button" onClick={() => setConfirming(true)}>Submit final evaluation</button>
        </div>
        {confirming ? <ConfirmDialog title="Confirm final submission" cancelLabel="Keep editing" confirmLabel="Confirm and submit" name="intent" value="final" onClose={() => setConfirming(false)}>
          Your final evaluation cannot be edited. Review your response before confirming.
          <input type="hidden" name="confirmed" value="yes" />
        </ConfirmDialog> : null}
      </fieldset>
    </form>}
  </section>;
}
