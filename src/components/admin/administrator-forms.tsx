"use client";

import { useActionState, useRef, useState } from "react";

import {
  grantPlatformAdminAction,
  manageAccountAction,
  postNoticeAction,
  removeNoticeAction,
  revokePlatformAdminAction,
} from "@/app/(protected)/admin/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button, field, textarea } from "@/components/controls";
import { type AccountOperation, type AccountProjection, type AdminReviewActionState, initialAdminReviewState } from "@/lib/admin/types";
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

function ActionMessage({ state }: { state: AdminReviewActionState }) {
  if (!state.message) return null;
  return (
    <p className={`m-0 text-label leading-snug ${formStatusColor(state.status)}`} role={state.status === "success" ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

const confirmCopy: Record<Exclude<AccountOperation, "rename" | "password">, { title: string; label: string; danger: boolean; body: string }> = {
  signout: { title: "Sign out everywhere?", label: "Sign out", danger: false, body: "will be signed out on every device." },
  disable: { title: "Disable sign-in?", label: "Disable", danger: true, body: "will be signed out and can't log in until you enable the account again." },
  enable: { title: "Enable sign-in?", label: "Enable", danger: false, body: "will be able to log in again." },
  delete: { title: "Delete account?", label: "Delete account", danger: true, body: "will be permanently deleted with their settings and memberships. This can't be undone." },
};

/** Rename, temporary password, sign out, disable/enable, and delete for one account. */
export function ManageAccountForms({ account }: { account: AccountProjection }) {
  const [state, formAction, pending] = useActionState(manageAccountAction, initialAdminReviewState);
  const [confirming, setConfirming] = useState<keyof typeof confirmCopy | null>(null);
  const [confirmingPassword, setConfirmingPassword] = useState(false);
  const copy = confirming ? confirmCopy[confirming] : null;
  const id = account.user_id;

  return (
    <div className="mt-3 grid gap-4 border-t border-(--border-shell) pt-3">
      <form className="grid gap-1.5" action={formAction}>
        <input type="hidden" name="targetUserId" value={id} />
        <input type="hidden" name="op" value="rename" />
        <label className="text-caption font-extrabold" htmlFor={`name-${id}`}>Display name</label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[560px]:grid-cols-1">
          <input id={`name-${id}`} name="displayName" className={field} defaultValue={account.display_name} maxLength={100} required aria-invalid={Boolean(state.fieldErrors?.displayName)} />
          <button className={button("secondary")} type="submit" disabled={pending}>Save name</button>
        </div>
        {state.fieldErrors?.displayName && <small className={fieldErrorClass}>{state.fieldErrors.displayName}</small>}
      </form>

      <form className="grid gap-1.5" action={formAction}>
        <input type="hidden" name="targetUserId" value={id} />
        <input type="hidden" name="op" value="password" />
        <label className="text-caption font-extrabold" htmlFor={`password-${id}`}>Temporary password</label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[560px]:grid-cols-1">
          <input id={`password-${id}`} name="password" type="text" autoComplete="off" className={field} placeholder="8+ characters, a letter and a number" aria-invalid={Boolean(state.fieldErrors?.password)} />
          <button className={button("secondary")} type="button" disabled={pending} onClick={() => setConfirmingPassword(true)}>Set password</button>
        </div>
        {state.fieldErrors?.password && <small className={fieldErrorClass}>{state.fieldErrors.password}</small>}
        <small className="text-label text-(--text-muted)">Give it to the user directly; they can change it in Settings.</small>
        {confirmingPassword ? (
          <ConfirmDialog title="Set a temporary password?" confirmLabel="Set password" onClose={() => setConfirmingPassword(false)}>
            {account.display_name}&apos;s current password will stop working and they will be signed out everywhere.
          </ConfirmDialog>
        ) : null}
      </form>

      <form className="flex flex-wrap gap-2" action={formAction}>
        <input type="hidden" name="targetUserId" value={id} />
        <button className={button("secondary")} type="button" disabled={pending} onClick={() => setConfirming("signout")}>Sign out everywhere</button>
        {account.disabled ? (
          <button className={button("secondary")} type="button" disabled={pending} onClick={() => setConfirming("enable")}>Enable sign-in</button>
        ) : (
          <button className={button("secondary")} type="button" disabled={pending} onClick={() => setConfirming("disable")}>Disable sign-in</button>
        )}
        <button className={button("danger")} type="button" disabled={pending} onClick={() => setConfirming("delete")}>Delete account</button>
        {copy && confirming ? (
          <ConfirmDialog title={copy.title} confirmLabel={copy.label} danger={copy.danger} name="op" value={confirming} onClose={() => setConfirming(null)}>
            {account.display_name} ({account.email}) {copy.body}
          </ConfirmDialog>
        ) : null}
      </form>

      <ActionMessage state={state} />
    </div>
  );
}

export function PostNoticeForm() {
  const [state, formAction, pending] = useActionState(postNoticeAction, initialAdminReviewState);
  const offsetRef = useRef<HTMLInputElement>(null);

  return (
    // The browser's timezone offset turns the local "Hide after" time into the right instant on the server.
    <form className="grid gap-3" action={formAction} onSubmit={() => { if (offsetRef.current) offsetRef.current.value = String(new Date().getTimezoneOffset()); }}>
      <input ref={offsetRef} type="hidden" name="tzOffset" defaultValue="0" />
      <label className="grid gap-1.5 text-caption font-extrabold">
        Message
        <textarea name="message" className={textarea} rows={3} maxLength={300} required placeholder="ThoraxScan will be down for maintenance on Saturday, 10 PM–12 AM." aria-invalid={Boolean(state.fieldErrors?.message)} />
      </label>
      {state.fieldErrors?.message && <small className={fieldErrorClass}>{state.fieldErrors.message}</small>}
      <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
        <label className="grid gap-1.5 text-caption font-extrabold">
          Style
          <select name="tone" className={field} defaultValue="warning">
            <option value="warning">Warning (maintenance, outages)</option>
            <option value="info">Information</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-caption font-extrabold">
          Hide after (optional)
          <input name="endsAt" type="datetime-local" className={field} aria-invalid={Boolean(state.fieldErrors?.endsAt)} />
        </label>
      </div>
      {state.fieldErrors?.endsAt && <small className={fieldErrorClass}>{state.fieldErrors.endsAt}</small>}
      <button className={`${button("primary")} w-fit`} type="submit" disabled={pending}>{pending ? "Posting…" : "Post notice"}</button>
      <ActionMessage state={state} />
    </form>
  );
}

export function RemoveNoticeForm({ noticeId }: { noticeId: string }) {
  const [state, formAction, pending] = useActionState(removeNoticeAction, initialAdminReviewState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form className="grid justify-items-end gap-1 max-[560px]:justify-items-start" action={formAction}>
      <input type="hidden" name="noticeId" value={noticeId} />
      <button className={button("danger")} type="button" disabled={pending} onClick={() => setConfirming(true)}>Remove</button>
      {confirming ? (
        <ConfirmDialog title="Remove notice?" confirmLabel="Remove notice" danger onClose={() => setConfirming(false)}>
          The notice will disappear from every page.
        </ConfirmDialog>
      ) : null}
      {state.status === "error" || state.status === "unauthorized" ? <ActionMessage state={state} /> : null}
    </form>
  );
}
