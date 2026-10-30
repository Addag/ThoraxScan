"use client";

import { useActionState, useRef, useState } from "react";

import { grantPlatformAdminAction, revokePlatformAdminAction } from "@/app/(protected)/admin/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button, field } from "@/components/controls";
import { initialAdminReviewState } from "@/lib/admin/types";
import { formStatusColor } from "@/components/dashboard-ui";
import { fieldErrorClass } from "@/components/field-error";

export function AddAdministratorForm() {
  const [state, formAction, pending] = useActionState(grantPlatformAdminAction, initialAdminReviewState);
  const emailRef = useRef<HTMLInputElement>(null);
  const [confirmingEmail, setConfirmingEmail] = useState("");

  return (
    <form className="mt-4 grid gap-2 border-t border-(--border-shell) pt-4" action={formAction} noValidate>
      <label className="text-caption font-extrabold text-(--text-primary)" htmlFor="administrator-email">Add an administrator</label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[560px]:grid-cols-1">
        <input
          ref={emailRef}
          id="administrator-email"
          name="email"
          type="email"
          autoComplete="off"
          className={field}
          placeholder="Email of an existing account"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <button
          type="button"
          disabled={pending}
          className={button("primary")}
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
        <p className={`m-0 text-label leading-snug ${formStatusColor(state.status)}`} role={state.status === "success" ? "status" : "alert"}>
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
        className={button("danger")}
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
        <p className={`m-0 text-label leading-snug ${formStatusColor(state.status)}`} role="alert">{state.message}</p>
      )}
    </form>
  );
}
