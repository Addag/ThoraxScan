"use client";

import { useActionState, useState } from "react";

import { reviewProfessorApplicationAction } from "@/app/(protected)/admin/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { primaryButton } from "@/components/primary-button";
import { reviewFieldClass } from "@/components/admin/review-styles";
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
          className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-[0.58]`}
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
          <small className="text-[0.625rem] text-[#d0ab56] light:text-(--status-warning-text)">
            {!application.email_confirmed
              ? "Email confirmation required"
              : "Existing memberships must be removed"}
          </small>
        )}
      </div>

      {application.status === "pending" && (
        <details className="rounded-[6px] border border-[#633f49] light:border-(--border-subtle) p-2.5">
          <summary className="cursor-pointer text-[0.75rem] font-extrabold text-[#ffb4b4] light:text-(--status-error-text)">Reject application</summary>
          <label className="mt-3 mb-1.5 block text-[0.6875rem] font-extrabold" htmlFor={`rejection-reason-${application.user_id}`}>
            Reason <span>(optional)</span>
          </label>
          <textarea
            className={`${reviewFieldClass} min-h-[78px] pt-[9px] resize-y`}
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
            className="transition-colors duration-160 not-disabled:hover:bg-[rgba(160,32,32,0.32)] mt-[9px] rounded-[6px] border border-[#d45b60] bg-[rgba(160,32,32,0.2)] px-3 py-[9px] font-extrabold text-[#ffb4b4] light:text-(--status-error-text) disabled:cursor-not-allowed disabled:opacity-[0.58]"
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
          className={`col-span-full m-0 text-[0.6875rem] leading-[1.35] ${formStatusColor(state.status)}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

