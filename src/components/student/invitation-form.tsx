"use client";

import { useActionState } from "react";

import { redeemInvitationAction } from "@/app/(protected)/student/actions";
import { button, field } from "@/components/controls";
import { initialInvitationState } from "@/lib/workspaces/types";
import { formStatusColor } from "@/components/dashboard-ui";

export function InvitationForm() {
  const [state, formAction, pending] = useActionState(
    redeemInvitationAction,
    initialInvitationState,
  );

  return (
    <form action={formAction} noValidate>
      <label className="block text-small font-extrabold" htmlFor="student-invitation-code">Student invitation code</label>
      <p className="mt-[3px] mb-[9px] text-label text-(--text-muted)">Enter the private code shared by your professor.</p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[600px]:grid-cols-1">
        <input
          id="student-invitation-code"
          name="code"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={22}
          placeholder="Paste your 22-character code"
          className={field}
          aria-invalid={Boolean(state.fieldErrors?.code)}
          aria-describedby={state.message ? "student-invitation-status" : undefined}
        />
        <button className={`${button("primary")} max-[600px]:w-full`} type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join workspace"}
        </button>
      </div>
      {state.message && (
        <p
          id="student-invitation-status"
          className={`mt-[9px] text-caption leading-snug ${formStatusColor(state.status)}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

