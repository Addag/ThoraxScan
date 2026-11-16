"use client";

import { useActionState, useEffect, useState } from "react";
import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { initialSubmissionState, type StudentSubmission, type SubmissionActionState } from "@/lib/submissions/types";
import { labelsError, toggleLabel } from "@/lib/submissions/validation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button } from "@/components/controls";
import { activityFormHeadingClass, activityFormHeadingIconClass, activityFormHeadingKickerClass, activityFormHeadingTitleClass } from "@/components/activities/activity-form-styles";

export function StudentSubmissionForm({ submission, dueAt, deadlinePassed, action }: {
  submission: StudentSubmission | null;
  dueAt: string | null;
  deadlinePassed: boolean;
  action: (previous: SubmissionActionState, data: FormData) => Promise<SubmissionActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialSubmissionState);
  const [labels, setLabels] = useState<ActivityAILabel[]>(submission?.labels ?? []);
  const [confirming, setConfirming] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const edited = () => { setConfirming(false); setIncomplete(false); };
  // Same rule the server applies, so an unfinished answer is caught before the confirmation opens.
  const startFinal = () => labelsError(labels) ? setIncomplete(true) : setConfirming(true);
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
  const error = state.fieldErrors?.labels;
  const message = pending ? "Saving your response…"
    : submitted ? state.message || "Submitted · This response is permanently locked."
    : closed ? "Deadline passed · Not submitted. Your draft is read-only."
    : state.message || (submission ? "Draft · Not submitted. Save changes or submit your final evaluation." : "Not started · Save a private draft or submit your final evaluation.");
  const lockedLabels = submission?.labels.length ? submission.labels : labels;
  return <section className="rounded-panel border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-6 max-[520px]:p-5">
    <div className={activityFormHeadingClass}><span className={activityFormHeadingIconClass} aria-hidden="true">➤</span><div><p className={activityFormHeadingKickerClass}>Student response</p><h2 className={activityFormHeadingTitleClass}>Your evaluation</h2></div></div>
    <p className="my-3 text-small leading-normal" role="status" aria-live="polite">{message}</p>
    {submission?.submittedAt ? <p className="my-3 text-small leading-normal">Submitted <time dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString()}</time></p> : null}
    {locked ? <div className="[overflow-wrap:anywhere]">
      <h3 className="m-0 text-small font-semibold">Labels you selected</h3>
      {lockedLabels.length ? <ul className="mx-0 mt-1 mb-0 grid list-disc gap-1 pl-5 text-small">{lockedLabels.map((label) => <li key={label}>{label}</li>)}</ul> : <p className="mx-0 mt-1 mb-0 text-small">No labels selected</p>}
    </div> : <form action={formAction}>
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-3 border-0 p-0">
        {/* React resets the form after each save, which unticks controlled checkboxes. Remounting them when the save settles makes the ticked state their reset default. */}
        <fieldset key={pending ? "saving" : "idle"} className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 border-0 p-0 max-[520px]:grid-cols-1 aria-invalid:outline-2 aria-invalid:outline-(--status-error-text)" aria-describedby={error ? "labels-error" : "labels-hint"} aria-invalid={Boolean(error)}>
          <legend className="mb-2 p-0 text-small text-(--text-secondary)">Which findings are present in this X-ray?</legend>
          {ACTIVITY_AI_LABELS.map((label) => <label className="flex items-center gap-2 text-small text-(--text-secondary)" key={label}>
            <input className="size-4 accent-brand" type="checkbox" name="labels" value={label} checked={labels.includes(label)} onChange={() => { setLabels(toggleLabel(labels, label)); edited(); }} />{label}
          </label>)}
        </fieldset>
        <small className="text-caption text-(--text-muted)" id="labels-hint">Select every finding you see. Choose No Finding on its own for a normal X-ray. Wrong extra selections lower your score.</small>
        {error ? <small className="text-caption text-(--status-error-text)" id="labels-error" role="alert">{error}</small> : null}
        <div className="flex flex-wrap gap-4">
          <button className={button("secondary")} type="submit" name="intent" value="draft" onClick={edited}>Save draft</button>
          <button className={button("primary")} type="button" onClick={startFinal}>Submit final evaluation</button>
        </div>
        {incomplete ? <p className="m-0 rounded-control border border-(--status-error-text) px-3 py-2 text-small font-semibold text-(--status-error-text)" role="alert">Select at least one label before submitting.</p> : null}
        {confirming ? <ConfirmDialog title="Confirm final submission" cancelLabel="Keep editing" confirmLabel="Confirm and submit" name="intent" value="final" onClose={() => setConfirming(false)}>
          Your final evaluation cannot be edited. Review your response before confirming.
          <input type="hidden" name="confirmed" value="yes" />
        </ConfirmDialog> : null}
      </fieldset>
    </form>}
  </section>;
}
