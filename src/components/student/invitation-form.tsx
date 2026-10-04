"use client";

import { useActionState } from "react";

import { redeemInvitationAction } from "@/app/(protected)/student/actions";
import { primaryButton } from "@/components/primary-button";
import { initialInvitationState } from "@/lib/workspaces/types";

export function InvitationForm() {
  const [state, formAction, pending] = useActionState(
    redeemInvitationAction,
    initialInvitationState,
  );

  return (
    <form className="student-invite-form" action={formAction} noValidate>
      <label htmlFor="student-invitation-code">Student invitation code</label>
      <p>Enter the private code shared by your professor.</p>
      <div className="student-invite-form__controls">
        <input
          id="student-invitation-code"
          name="code"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={22}
          placeholder="Paste your 22-character code"
          aria-invalid={Boolean(state.fieldErrors?.code)}
          aria-describedby={state.message ? "student-invitation-status" : undefined}
        />
        <button className={`${primaryButton} min-h-[45px] px-[18px] disabled:cursor-wait disabled:opacity-70 max-[600px]:w-full`} type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join workspace"}
        </button>
      </div>
      {state.message && (
        <p
          id="student-invitation-status"
          className={`student-form-status student-form-status--${state.status}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

