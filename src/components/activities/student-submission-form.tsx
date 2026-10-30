"use client";

import { useActionState, useEffect, useState } from "react";
import { initialSubmissionState, type StudentSubmission, type SubmissionActionState } from "@/lib/submissions/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button, field, textarea } from "@/components/controls";
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
  const fieldError = (field: "visibleFindings" | "classification" | "relevantRegion") => errors?.[field] ? <small className="text-caption text-(--status-error-text)" id={`${field}-error`} role="alert">{errors[field]}</small> : null;
  return <section className="rounded-panel border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-6 max-[520px]:p-5">
    <div className={activityFormHeadingClass}><span className={activityFormHeadingIconClass} aria-hidden="true">➤</span><div><p className={activityFormHeadingKickerClass}>Student response</p><h2 className={activityFormHeadingTitleClass}>Your evaluation</h2></div></div>
    <p className="my-3 text-small leading-normal" role="status" aria-live="polite">{message}</p>
    {submission?.submittedAt ? <p className="my-3 text-small leading-normal">Submitted <time dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString()}</time></p> : null}
    {locked ? <dl className="grid gap-4 [overflow-wrap:anywhere]">
      <div><dt className="font-semibold">Visible findings</dt><dd className="mx-0 mt-1 mb-0 whitespace-pre-wrap">{submission?.visibleFindings || findings || "No findings entered"}</dd></div>
      <div><dt className="font-semibold">Classification</dt><dd className="mx-0 mt-1 mb-0 whitespace-pre-wrap">{submission?.classification || classification || "Not selected"}</dd></div>
      {(submission?.classification || classification) === "abnormal" ? <div><dt className="font-semibold">Relevant region</dt><dd className="mx-0 mt-1 mb-0 whitespace-pre-wrap">{submission?.relevantRegion || region || "Not entered"}</dd></div> : null}
    </dl> : <form action={formAction}>
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-3 border-0 p-0 [&>label]:text-small [&>label]:text-(--text-secondary) [&_legend]:text-small [&_legend]:text-(--text-secondary) [&>small]:text-caption [&>small]:text-(--text-muted)">
        <label htmlFor="visibleFindings">What visible findings do you observe?</label>
        <textarea className={`${textarea} disabled:opacity-55`} id="visibleFindings" name="visibleFindings" rows={5} value={findings} onChange={(event) => { setFindings(event.target.value); setConfirming(false); }} aria-invalid={Boolean(errors?.visibleFindings)} aria-describedby={errors?.visibleFindings ? "visibleFindings-error" : undefined} />
        {fieldError("visibleFindings")}
        <fieldset className="border-0 p-0 aria-invalid:outline-2 aria-invalid:outline-(--status-error-text)" aria-describedby={errors?.classification ? "classification-error" : undefined} aria-invalid={Boolean(errors?.classification)}>
          <legend>Normal or abnormal?</legend>
          <div className="flex flex-wrap gap-4">{["normal", "abnormal"].map((value) => <label className="flex items-center gap-2" key={value}><input className="size-4 accent-brand" type="radio" name="classification" value={value} checked={classification === value} onChange={() => { setClassification(value); if (value === "normal") setRegion(""); setConfirming(false); }} />{value === "normal" ? "Normal" : "Abnormal"}</label>)}</div>
        </fieldset>
        {fieldError("classification")}
        <label htmlFor="relevantRegion">Which region appears most relevant?</label>
        <input className={`${field} disabled:cursor-not-allowed disabled:opacity-55`} id="relevantRegion" name="relevantRegion" disabled={classification !== "abnormal"} value={region} onChange={(event) => { setRegion(event.target.value); setConfirming(false); }} aria-invalid={Boolean(errors?.relevantRegion)} aria-describedby={errors?.relevantRegion ? "relevantRegion-error" : "region-hint"} />
        <small className="text-caption text-(--text-muted)" id="region-hint">{classification === "abnormal" ? "Required for a final abnormal response." : "Select Abnormal to enter a region."} Maximum 200 characters.</small>
        {fieldError("relevantRegion")}
        <div className="flex flex-wrap gap-4">
          <button className={button("secondary")} type="submit" name="intent" value="draft" onClick={() => setConfirming(false)}>Save draft</button>
          <button className={button("primary")} type="button" onClick={() => setConfirming(true)}>Submit final evaluation</button>
        </div>
        {confirming ? <ConfirmDialog title="Confirm final submission" cancelLabel="Keep editing" confirmLabel="Confirm and submit" name="intent" value="final" onClose={() => setConfirming(false)}>
          Your final evaluation cannot be edited. Review your response before confirming.
          <input type="hidden" name="confirmed" value="yes" />
        </ConfirmDialog> : null}
      </fieldset>
    </form>}
  </section>;
}
