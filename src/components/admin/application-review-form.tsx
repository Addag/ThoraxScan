"use client";

import { useActionState } from "react";

import { reviewProfessorApplicationAction } from "@/app/(protected)/admin/actions";
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
  const canApprove = application.email_confirmed && application.membership_count === 0;

  return (
    <form className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(220px,1fr)] items-start gap-3 border-t border-[#33425c] pt-4 max-[760px]:grid-cols-1" action={formAction} noValidate>
      <input type="hidden" name="targetUserId" value={application.user_id} />
      <div className="flex items-center gap-2.5 max-[560px]:flex-col max-[560px]:items-stretch">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending || !canApprove}
          className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-[0.58]`}
        >
          {pending ? "Reviewing…" : application.status === "rejected" ? "Approve after review" : "Approve"}
        </button>
        {!canApprove && (
          <small className="text-[10px] text-[#d0ab56]">
            {!application.email_confirmed
              ? "Email confirmation required"
              : "Existing memberships must be removed"}
          </small>
        )}
      </div>

      {application.status === "pending" && (
        <details className="rounded-[6px] border border-[#633f49] p-2.5">
          <summary className="cursor-pointer text-[12px] font-extrabold text-[#ffb4b4]">Reject application</summary>
          <label className="mt-3 mb-1.5 block text-[11px] font-extrabold" htmlFor={`rejection-reason-${application.user_id}`}>
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
            className="transition-colors duration-160 not-disabled:hover:bg-[rgba(160,32,32,0.32)] mt-[9px] rounded-[6px] border border-[#d45b60] bg-[rgba(160,32,32,0.2)] px-3 py-[9px] font-extrabold text-[#ffb4b4] disabled:cursor-not-allowed disabled:opacity-[0.58]"
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
          className={`col-span-full m-0 text-[11px] leading-[1.35] ${formStatusColor(state.status)}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

