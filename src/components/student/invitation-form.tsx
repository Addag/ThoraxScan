"use client";

import { useActionState } from "react";

import { redeemInvitationAction } from "@/app/(protected)/student/actions";
import { primaryButton } from "@/components/primary-button";
import { initialInvitationState } from "@/lib/workspaces/types";
import { formStatusColor } from "@/components/dashboard-ui";

export function InvitationForm() {
  const [state, formAction, pending] = useActionState(
    redeemInvitationAction,
    initialInvitationState,
  );

  return (
    <form action={formAction} noValidate>
      <label className="block text-[13px] font-extrabold" htmlFor="student-invitation-code">Student invitation code</label>
      <p className="mt-[3px] mb-[9px] text-[11px] text-[#9ba2b8] light:text-(--text-muted)">Enter the private code shared by your professor.</p>
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
          className="min-h-[45px] w-full rounded-[6px] border border-[#66718b] light:border-(--border-strong) bg-[#0c1320] light:bg-(--surface-raised) px-[13px] text-(--text-primary) placeholder:text-[#9ba2b8] light:placeholder:text-(--text-muted) aria-invalid:border-[#ff6b6b]"
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
          className={`mt-[9px] text-[12px] leading-[1.4] ${formStatusColor(state.status)}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

