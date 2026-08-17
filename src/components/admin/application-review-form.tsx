"use client";

import { useActionState } from "react";

import { reviewProfessorApplicationAction } from "@/app/(protected)/admin/actions";
import {
  initialAdminReviewState,
  type ProfessorApplicationProjection,
} from "@/lib/admin/types";

export function ApplicationReviewForm({
  application,
}: {
  application: ProfessorApplicationProjection;
}) {
  const [state, formAction, pending] = useActionState(
    reviewProfessorApplicationAction,
    initialAdminReviewState,
  );
  const canApprove = application.email_confirmed && application.membership_count === 0;

  return (
    <form className="admin-review-form" action={formAction} noValidate>
      <input type="hidden" name="targetUserId" value={application.user_id} />
      <div className="admin-review-form__primary">
        <button
          className="primary-button"
          type="submit"
          name="decision"
          value="approve"
          disabled={pending || !canApprove}
        >
          {pending ? "Reviewing…" : application.status === "rejected" ? "Approve after review" : "Approve"}
        </button>
        {!canApprove && (
          <small>
            {!application.email_confirmed
              ? "Email confirmation required"
              : "Existing memberships must be removed"}
          </small>
        )}
      </div>

      {application.status === "pending" && (
        <details className="admin-reject-details">
          <summary>Reject application</summary>
          <label htmlFor={`rejection-reason-${application.user_id}`}>
            Reason <span>(optional)</span>
          </label>
          <textarea
            id={`rejection-reason-${application.user_id}`}
            name="rejectionReason"
            maxLength={500}
            rows={3}
            aria-invalid={Boolean(state.fieldErrors?.rejectionReason)}
            placeholder="Explain what the applicant should do next."
          />
          {state.fieldErrors?.rejectionReason && (
            <small className="field-error">{state.fieldErrors.rejectionReason}</small>
          )}
          <button
            className="admin-reject-button"
            type="submit"
            name="decision"
            value="reject"
            disabled={pending}
          >
            {pending ? "Reviewing…" : "Confirm rejection"}
          </button>
        </details>
      )}

      {state.message && (
        <p
          className={`professor-form-status professor-form-status--${state.status}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
