"use client";

import { useActionState, useState } from "react";

import {
  createInvitationAction,
  createWorkspaceAction,
  leaveWorkspaceAction,
  redeemInvitationAction,
  removeMemberAction,
  renameWorkspaceAction,
  revokeInvitationAction,
} from "@/app/(protected)/professor/actions";
import { button, field } from "@/components/controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { AppRole } from "@/lib/auth/types";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
} from "@/lib/workspaces/types";
import { formStatusColor } from "@/components/dashboard-ui";

const fieldLabelClass = "block text-[0.75rem] font-extrabold text-(--text-primary)";
const busyClass = "disabled:cursor-wait disabled:opacity-[0.68]";
const actionControlsClass = "grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[700px]:grid-cols-1";
const descriptionClass = "mt-[3px] mb-2.5 text-[0.6875rem] text-(--text-muted)";
const inlineButtonClass = `transition-colors duration-160 not-disabled:hover:bg-(--hover-overlay) cursor-pointer border-0 bg-transparent p-[7px] text-[0.6875rem] font-extrabold text-(--status-error-text) ${busyClass}`;
const panelBase = "rounded-panel border [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";

function FormStatus({ state, className = "" }: { state: WorkspaceActionState; className?: string }) {
  if (!state.message) return null;
  return (
    <p
      className={`mt-[9px] text-[0.6875rem] leading-[1.35] ${formStatusColor(state.status)} ${className}`}
      role={state.status === "success" ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(
    createWorkspaceAction,
    initialWorkspaceActionState,
  );
  return (
    <form action={formAction} noValidate>
      <label className={fieldLabelClass} htmlFor="new-workspace-name">Workspace name</label>
      <p className={descriptionClass}>Create a class space that you own and manage.</p>
      <div className={actionControlsClass}>
        <input
          className={field}
          id="new-workspace-name"
          name="name"
          type="text"
          minLength={3}
          maxLength={100}
          placeholder="e.g. RAD 302 — Section A"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <button className={`${button("primary")} max-[700px]:w-full`} type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create workspace"}
        </button>
      </div>
      <FormStatus state={state} />
    </form>
  );
}

export function ProfessorRedeemForm() {
  const [state, formAction, pending] = useActionState(
    redeemInvitationAction,
    initialWorkspaceActionState,
  );
  return (
    <form action={formAction} noValidate>
      <label className={fieldLabelClass} htmlFor="professor-invitation-code">Professor invitation code</label>
      <p className={descriptionClass}>Join a workspace as a co-professor.</p>
      <div className={actionControlsClass}>
        <input
          className={field}
          id="professor-invitation-code"
          name="code"
          type="text"
          maxLength={22}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Paste your 22-character code"
          aria-invalid={Boolean(state.fieldErrors?.code)}
        />
        <button className={`${button("primary")} max-[700px]:w-full`} type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join workspace"}
        </button>
      </div>
      <FormStatus state={state} />
    </form>
  );
}

export function RenameWorkspaceForm({
  workspaceId,
  currentName,
}: {
  workspaceId: string;
  currentName: string;
}) {
  const [state, formAction, pending] = useActionState(
    renameWorkspaceAction,
    initialWorkspaceActionState,
  );
  return (
    <form className="w-[min(420px,100%)] max-[1000px]:w-full" action={formAction} noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className={fieldLabelClass} htmlFor="rename-workspace">Workspace name</label>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-[9px] max-[700px]:grid-cols-1">
        <input
          className={field}
          id="rename-workspace"
          name="name"
          type="text"
          defaultValue={currentName}
          minLength={3}
          maxLength={100}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <button className={`${button("secondary")} max-[700px]:w-full`} type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save name"}
        </button>
      </div>
      <FormStatus state={state} />
    </form>
  );
}

export function InvitationCreateForm({
  workspaceId,
  invitedRole,
}: {
  workspaceId: string;
  invitedRole: AppRole;
}) {
  const [state, formAction, pending] = useActionState(
    createInvitationAction,
    initialWorkspaceActionState,
  );
  const [copied, setCopied] = useState(false);
  const isStudent = invitedRole === "student";

  async function copyCode() {
    if (!state.invitationCode) return;
    await navigator.clipboard.writeText(state.invitationCode);
    setCopied(true);
  }

  return (
    <form className="rounded-lg border border-(--border-shell) bg-(--surface-sunken) p-4" action={formAction} noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="invitedRole" value={invitedRole} />
      <div className="mb-[13px] grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
        <label className="flex flex-col gap-1.5 text-[0.75rem] font-extrabold text-(--text-primary)">
          Expires in
          <span className="flex items-center gap-[7px] text-[0.6875rem] font-normal text-(--text-muted)">
            <input
              className={field}
              name="expiresInDays"
              type="number"
              min={1}
              max={30}
              defaultValue={7}
              aria-invalid={Boolean(state.fieldErrors?.expiresInDays)}
            /> days
          </span>
        </label>
        {isStudent ? (
          <label className="flex flex-col gap-1.5 text-[0.75rem] font-extrabold text-(--text-primary)">
            Maximum uses
            <input
              className={field}
              name="maxUses"
              type="number"
              min={1}
              max={500}
              defaultValue={30}
              aria-invalid={Boolean(state.fieldErrors?.maxUses)}
            />
          </label>
        ) : (
          <input type="hidden" name="maxUses" value="1" />
        )}
      </div>
      <button className={`${button("primary")} max-[700px]:w-full`} type="submit" disabled={pending}>
        {pending
          ? "Generating…"
          : `Generate ${isStudent ? "Student" : "Professor"} code`}
      </button>
      <FormStatus state={state} />
      {state.invitationCode && (
        <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 rounded-control border border-[#0077ff] bg-[rgba(0,119,255,0.18)] p-3 max-[700px]:grid-cols-1" role="status">
          <strong className="col-span-full text-[0.6875rem] uppercase text-(--brand-blue-text)">Copy this code now</strong>
          <code className="self-center overflow-hidden text-[0.875rem] text-(--text-primary) text-ellipsis whitespace-nowrap">{state.invitationCode}</code>
          <button className={button("secondary")} type="button" onClick={copyCode}>
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
      )}
    </form>
  );
}

export function RevokeInvitationButton({
  invitationId,
}: {
  invitationId: string;
}) {
  const [state, formAction, pending] = useActionState(
    revokeInvitationAction,
    initialWorkspaceActionState,
  );
  const [confirming, setConfirming] = useState(false);
  return (
    <form className="flex flex-col items-end" action={formAction}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <button className={inlineButtonClass} type="button" disabled={pending} onClick={() => setConfirming(true)}>
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {confirming ? (
        <ConfirmDialog title="Revoke invitation?" confirmLabel="Revoke invitation" danger onClose={() => setConfirming(false)}>
          This invitation code will stop working immediately.
        </ConfirmDialog>
      ) : null}
      <FormStatus state={state} className="max-w-[150px] text-right" />
    </form>
  );
}

export function RemoveMemberButton({
  workspaceId,
  memberUserId,
}: {
  workspaceId: string;
  memberUserId: string;
}) {
  const [state, formAction, pending] = useActionState(
    removeMemberAction,
    initialWorkspaceActionState,
  );
  const [confirming, setConfirming] = useState(false);
  return (
    <form className="flex flex-col items-end" action={formAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="memberUserId" value={memberUserId} />
      <button className={inlineButtonClass} type="button" disabled={pending} onClick={() => setConfirming(true)}>
        {pending ? "Removing…" : "Remove"}
      </button>
      {confirming ? (
        <ConfirmDialog title="Remove member?" confirmLabel="Remove member" danger onClose={() => setConfirming(false)}>
          This member will lose access to the workspace and its activities.
        </ConfirmDialog>
      ) : null}
      <FormStatus state={state} className="max-w-[150px] text-right" />
    </form>
  );
}

export function LeaveWorkspaceForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction, pending] = useActionState(
    leaveWorkspaceAction,
    initialWorkspaceActionState,
  );
  const [confirming, setConfirming] = useState(false);
  return (
    <form className={`${panelBase} mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[18px] border-[#7b3437] p-6 max-[700px]:grid-cols-1`} action={formAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div>
        <strong className="text-[0.8125rem] text-(--status-error-text)">Leave this workspace</strong>
        <p className="mt-1 mb-0 text-[0.6875rem] text-(--text-muted)">You will need another Professor invitation to rejoin.</p>
      </div>
      <button className={button("danger")} type="button" disabled={pending} onClick={() => setConfirming(true)}>
        {pending ? "Leaving…" : "Leave workspace"}
      </button>
      {confirming ? (
        <ConfirmDialog title="Leave workspace?" confirmLabel="Leave workspace" danger onClose={() => setConfirming(false)}>
          You will need another Professor invitation to rejoin.
        </ConfirmDialog>
      ) : null}
      <FormStatus state={state} className="col-span-full" />
    </form>
  );
}

