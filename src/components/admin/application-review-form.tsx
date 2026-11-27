"use client";

import { useActionState, useState } from "react";

import { reviewProfessorApplicationAction } from "@/app/(protected)/admin/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button, textarea } from "@/components/controls";
import {
  initialAdminReviewState,
  type ProfessorApplicationProjection,
} from "@/lib/admin/types";
import { formStatusColor } from "@/components/dashboard-ui";
import { fieldErrorClass } from "@/components/field-error";

export function ApplicationReviewForm({
  application,
}: {
  application: ProfessorApplicationProjection;
}) {
  const [state, formAction, pending] = useActionState(
    reviewProfessorApplicationAction,
    initialAdminReviewState,
  );
  const [confirmingApproval, setConfirmingApproval] = useState(false);
  const [confirmingRejection, setConfirmingRejection] = useState(false);
  const canApprove = application.email_confirmed && application.membership_count === 0;

  return (
    <form className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(220px,1fr)] items-start gap-3 border-t border-(--border-shell) pt-4 max-[760px]:grid-cols-1" action={formAction} noValidate>
      <input type="hidden" name="targetUserId" value={application.user_id} />
      <div className="flex items-center gap-2.5 max-[560px]:flex-col max-[560px]:items-stretch">
        <button
          type="button"
          disabled={pending || !canApprove}
          className={button("primary")}
          onClick={() => setConfirmingApproval(true)}
        >
          {pending ? "Reviewing…" : application.status === "rejected" ? "Approve after review" : "Approve"}
        </button>
        {confirmingApproval ? (
          <ConfirmDialog title="Approve Professor access?" confirmLabel="Confirm approval" name="decision" value="approve" onClose={() => setConfirmingApproval(false)}>
            {application.display_name} will be able to create workspaces and manage students. This can&apos;t be undone from this page.
          </ConfirmDialog>
        ) : null}
        {!canApprove && (
          <small className="text-label text-(--status-warning-text)">
            {!application.email_confirmed
              ? "Email confirmation required"
              : "Existing memberships must be removed"}
          </small>
        )}
      </div>

      {application.status === "pending" && (
        <details className="rounded-control border border-(--border-subtle) p-2.5">
          <summary className="cursor-pointer text-caption font-extrabold text-(--status-error-text)">Reject application</summary>
          <label className="mt-3 mb-1.5 block text-label font-extrabold" htmlFor={`rejection-reason-${application.user_id}`}>
            Reason <span>(optional)</span>
          </label>
          <textarea
            className={`${textarea} min-h-[78px]`}
            id={`rejection-reason-${application.user_id}`}
            name="rejectionReason"
            maxLength={500}
            rows={3}
            aria-invalid={Boolean(state.fieldErrors?.rejectionReason)}
            placeholder="Explain what the applicant should do next."
          />
          {state.fieldErrors?.rejectionReason && (
            <small className={fieldErrorClass}>{state.fieldErrors.rejectionReason}</small>
          )}
          <button
            className={`${button("danger")} mt-2.5`}
            type="button"
            disabled={pending}
            onClick={() => setConfirmingRejection(true)}
          >
            {pending ? "Reviewing…" : "Reject application"}
          </button>
          {confirmingRejection ? (
            <ConfirmDialog title="Reject application?" confirmLabel="Confirm rejection" name="decision" value="reject" danger onClose={() => setConfirmingRejection(false)}>
              The applicant will not receive Professor access. You can still approve the application later.
            </ConfirmDialog>
          ) : null}
        </details>
      )}

      {state.message && (
        <p
          className={`col-span-full m-0 text-label leading-snug ${formStatusColor(state.status)}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

