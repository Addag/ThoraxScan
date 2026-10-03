"use client";

import { useActionState, useEffect, useState } from "react";
import { initialSubmissionState, type StudentSubmission, type SubmissionActionState } from "@/lib/submissions/types";
import { activityButton } from "@/components/activities/activity-button";

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
  const fieldError = (field: "visibleFindings" | "classification" | "relevantRegion") => errors?.[field] ? <small id={`${field}-error`} role="alert">{errors[field]}</small> : null;
  return <section className="student-evaluation-panel">
    <div className="activity-form-heading"><span aria-hidden="true">➤</span><div><p>Student response</p><h2>Your Evaluation</h2></div></div>
    <p role="status" aria-live="polite">{message}</p>
    {submission?.submittedAt ? <p>Submitted <time dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString()}</time></p> : null}
    {locked ? <dl className="submission-summary">
      <div><dt>Visible findings</dt><dd>{submission?.visibleFindings || findings || "No findings entered"}</dd></div>
      <div><dt>Classification</dt><dd>{submission?.classification || classification || "Not selected"}</dd></div>
      {(submission?.classification || classification) === "abnormal" ? <div><dt>Relevant region</dt><dd>{submission?.relevantRegion || region || "Not entered"}</dd></div> : null}
    </dl> : <form action={formAction}>
      <fieldset disabled={pending} className="submission-fields">
        <label htmlFor="visibleFindings">What visible findings do you observe?</label>
        <textarea id="visibleFindings" name="visibleFindings" rows={5} value={findings} onChange={(event) => { setFindings(event.target.value); setConfirming(false); }} aria-invalid={Boolean(errors?.visibleFindings)} aria-describedby={errors?.visibleFindings ? "visibleFindings-error" : undefined} />
        {fieldError("visibleFindings")}
        <fieldset aria-describedby={errors?.classification ? "classification-error" : undefined} aria-invalid={Boolean(errors?.classification)}>
          <legend>Normal or abnormal?</legend>
          <div className="submission-classification">{["normal", "abnormal"].map((value) => <label key={value}><input type="radio" name="classification" value={value} checked={classification === value} onChange={() => { setClassification(value); if (value === "normal") setRegion(""); setConfirming(false); }} />{value === "normal" ? "Normal" : "Abnormal"}</label>)}</div>
        </fieldset>
        {fieldError("classification")}
        <label htmlFor="relevantRegion">Which region appears most relevant?</label>
        <input id="relevantRegion" name="relevantRegion" disabled={classification !== "abnormal"} value={region} onChange={(event) => { setRegion(event.target.value); setConfirming(false); }} aria-invalid={Boolean(errors?.relevantRegion)} aria-describedby={errors?.relevantRegion ? "relevantRegion-error" : "region-hint"} />
        <small id="region-hint">Required for a final abnormal response. Maximum 200 characters.</small>
        {fieldError("relevantRegion")}
        <div className="submission-actions">
          <button className={activityButton.secondary} type="submit" name="intent" value="draft" onClick={() => setConfirming(false)}>Save draft</button>
          <button className={activityButton.primary} type="button" onClick={() => setConfirming(true)}>Submit final evaluation</button>
        </div>
        {confirming ? <div className="submission-confirmation" role="group" aria-labelledby="confirmation-title">
          <strong id="confirmation-title">Confirm final submission</strong>
          <p>Your final evaluation cannot be edited. Review your response before confirming.</p>
          <input type="hidden" name="confirmed" value="yes" />
          <button className={activityButton.primary} type="submit" name="intent" value="final">Confirm and submit</button>
          <button className={activityButton.secondary} type="button" onClick={() => setConfirming(false)}>Keep editing</button>
        </div> : null}
      </fieldset>
    </form>}
  </section>;
}
