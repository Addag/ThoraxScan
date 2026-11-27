"use client";

import { useActionState } from "react";
import { saveLearningNoteAction } from "@/app/(protected)/actions";
import { button, textarea } from "@/components/controls";
import { initialLearningNoteActionState, MAX_LEARNING_NOTE_LENGTH } from "@/lib/learning-notes/types";

// Private self-review notes for one built-in case. Parents key this by case id so switching cases resets the form.
export function LearningNotes({ caseId, savedBody, onSaved, className }: {
  caseId: string | null;
  savedBody: string;
  onSaved: (caseId: string, body: string) => void;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(async (previous: typeof initialLearningNoteActionState, formData: FormData) => {
    const next = await saveLearningNoteAction(previous, formData);
    if (next.status === "success" && next.caseId !== undefined) onSaved(next.caseId, next.body ?? "");
    return next;
  }, initialLearningNoteActionState);

  return <section className={className} aria-labelledby="learning-notes-title">
    <h2 className="mb-2 text-title font-extrabold" id="learning-notes-title">My notes</h2>
    {caseId ? <form action={formAction}>
      <input type="hidden" name="caseId" value={caseId} />
      <label className="mb-2.5 block text-small text-(--text-secondary)" htmlFor="learning-notes-body">Your own notes on these findings. Private to you, not submitted or graded.</label>
      <textarea className={textarea} id="learning-notes-body" name="body" rows={5} maxLength={MAX_LEARNING_NOTE_LENGTH} defaultValue={savedBody} placeholder="What did you notice? What would you check next?" />
      <div className="mt-3 flex items-center gap-3">
        <button className={button("primary")} type="submit" disabled={pending}>{pending ? "Saving…" : "Save notes"}</button>
        <p className={`m-0 text-small ${state.status === "success" ? "text-(--brand-blue-text)" : "text-(--status-error-text)"}`} role="status">{state.message}</p>
      </div>
    </form> : <p className="m-0 text-small text-(--text-muted)">Notes can be saved for sample gallery cases. Choose a case from the gallery to keep notes on it.</p>}
  </section>;
}
