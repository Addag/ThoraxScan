"use client";

import { useActionState, useRef, useState } from "react";

import { grantPlatformAdminAction, revokePlatformAdminAction } from "@/app/(protected)/admin/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { primaryButton } from "@/components/primary-button";
import { reviewFieldClass } from "@/components/admin/review-styles";
import { initialAdminReviewState } from "@/lib/admin/types";
import { formStatusColor } from "@/components/dashboard-ui";
import { fieldErrorClass } from "@/components/field-error";

export function AddAdministratorForm() {
  const [state, formAction, pending] = useActionState(grantPlatformAdminAction, initialAdminReviewState);
  const emailRef = useRef<HTMLInputElement>(null);
  const [confirmingEmail, setConfirmingEmail] = useState("");

  return (
    <form className="mt-4 grid gap-2 border-t border-(--border-shell) pt-4" action={formAction} noValidate>
      <label className="text-[0.75rem] font-extrabold text-(--text-primary)" htmlFor="administrator-email">Add an administrator</label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[560px]:grid-cols-1">
        <input
          ref={emailRef}
          id="administrator-email"
          name="email"
          type="email"
          autoComplete="off"
          className={`${reviewFieldClass} h-[43px]`}
          placeholder="Email of an existing account"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <button
          type="button"
          disabled={pending}
          className={`${primaryButton} min-h-[43px] px-[17px] disabled:cursor-not-allowed disabled:opacity-[0.58]`}
          onClick={() => setConfirmingEmail(emailRef.current?.value.trim() ?? "")}
        >
          {pending ? "Adding…" : "Add administrator"}
        </button>
      </div>
      {state.fieldErrors?.email && <small className={fieldErrorClass}>{state.fieldErrors.email}</small>}
      {confirmingEmail ? (
        <ConfirmDialog title="Add administrator?" confirmLabel="Confirm" onClose={() => setConfirmingEmail("")}>
          {confirmingEmail} will be able to approve Professors and add or remove administrators.
        </ConfirmDialog>
      ) : null}
      {state.message && (
        <p className={`m-0 text-[0.6875rem] leading-[1.35] ${formStatusColor(state.status)}`} role={state.status === "success" ? "status" : "alert"}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function RemoveAdministratorForm({ userId, displayName }: { userId: string; displayName: string }) {
  const [state, formAction, pending] = useActionState(revokePlatformAdminAction, initialAdminReviewState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form className="grid justify-items-end gap-1 max-[560px]:justify-items-start" action={formAction}>
      <input type="hidden" name="targetUserId" value={userId} />
      <button
        className="transition-colors duration-160 not-disabled:hover:bg-[rgba(160,32,32,0.32)] rounded-[6px] border border-[#d45b60] bg-[rgba(160,32,32,0.2)] px-3 py-[7px] text-[0.75rem] font-extrabold text-[#ffb4b4] light:text-(--status-error-text) disabled:cursor-not-allowed disabled:opacity-[0.58]"
        type="button"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {confirming ? (
        <ConfirmDialog title="Remove administrator?" confirmLabel="Remove access" danger onClose={() => setConfirming(false)}>
          {displayName} will lose administrator access. Their past reviews keep their name.
        </ConfirmDialog>
      ) : null}
      {state.status !== "idle" && state.status !== "success" && (
        <p className={`m-0 text-[0.6875rem] leading-[1.35] ${formStatusColor(state.status)}`} role="alert">{state.message}</p>
      )}
    </form>
  );
}
