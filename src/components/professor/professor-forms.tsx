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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { primaryButton } from "@/components/primary-button";
import type { AppRole } from "@/lib/auth/types";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
} from "@/lib/workspaces/types";
import { formStatusColor } from "@/components/dashboard-ui";

const fieldLabelClass = "block text-[12px] font-extrabold text-(--text-primary)";
const fieldInputClass = "min-h-[43px] w-full min-w-0 rounded-[6px] border border-[#66718b] light:border-(--border-strong) bg-[#0c1320] light:bg-(--surface-raised) px-3 text-(--text-primary) aria-invalid:border-[#ff6b6b]";
const busyClass = "disabled:cursor-wait disabled:opacity-[0.68]";
const actionControlsClass = "grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[700px]:grid-cols-1";
const descriptionClass = "mt-[3px] mb-2.5 text-[11px] text-[#939caf] light:text-(--text-muted)";
const inlineButtonClass = `transition-colors duration-160 not-disabled:hover:bg-(--hover-overlay) cursor-pointer border-0 bg-transparent p-[7px] text-[10px] font-extrabold text-[#ff8d8f] light:text-(--status-error-text) ${busyClass}`;
const panelBase = "rounded-[10px] border [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";

function FormStatus({ state, className = "" }: { state: WorkspaceActionState; className?: string }) {
  if (!state.message) return null;
  return (
    <p
      className={`mt-[9px] text-[11px] leading-[1.35] ${formStatusColor(state.status)} ${className}`}
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
          className={`${fieldInputClass} placeholder:text-[#9ba2b8] light:placeholder:text-(--text-muted)`}
          id="new-workspace-name"
          name="name"
          type="text"
          minLength={3}
          maxLength={100}
          placeholder="e.g. RAD 302 — Section A"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <button className={`${primaryButton} min-h-[43px] px-[17px] max-[700px]:w-full ${busyClass}`} type="submit" disabled={pending}>
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
          className={`${fieldInputClass} placeholder:text-[#9ba2b8] light:placeholder:text-(--text-muted)`}
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
        <button className={`${primaryButton} min-h-[43px] px-[17px] max-[700px]:w-full ${busyClass}`} type="submit" disabled={pending}>
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
          className={fieldInputClass}
          id="rename-workspace"
          name="name"
          type="text"
          defaultValue={currentName}
          minLength={3}
          maxLength={100}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <button className={`transition-[filter] duration-160 not-disabled:hover:brightness-115 min-h-[43px] px-[15px] max-[700px]:w-full ${busyClass}`} type="submit" disabled={pending}>
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
    <form className="rounded-lg border border-[#3d4c67] bg-[rgba(4,8,40,0.3)] p-[18px]" action={formAction} noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="invitedRole" value={invitedRole} />
      <div className="mb-[13px] grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
        <label className="flex flex-col gap-1.5 text-[12px] font-extrabold text-(--text-primary)">
          Expires in
          <span className="flex items-center gap-[7px] text-[11px] font-normal text-[#9aa4b8] light:text-(--text-muted)">
            <input
              className={fieldInputClass}
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
          <label className="flex flex-col gap-1.5 text-[12px] font-extrabold text-(--text-primary)">
            Maximum uses
            <input
              className={fieldInputClass}
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
      <button className={`${primaryButton} min-h-[43px] px-[17px] max-[700px]:w-full ${busyClass}`} type="submit" disabled={pending}>
        {pending
          ? "Generating…"
          : `Generate ${isStudent ? "Student" : "Professor"} code`}
      </button>
      <FormStatus state={state} />
      {state.invitationCode && (
        <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 rounded-[7px] border border-[#0077ff] bg-[rgba(0,119,255,0.18)] p-3 max-[700px]:grid-cols-1" role="status">
          <strong className="col-span-full text-[11px] uppercase text-[#b9ddff] light:text-(--brand-blue-text)">Copy this code now</strong>
          <code className="self-center overflow-hidden text-[14px] text-(--text-primary) text-ellipsis whitespace-nowrap">{state.invitationCode}</code>
          <button className={`transition-colors duration-160 not-disabled:hover:bg-[#0e2547] cursor-pointer rounded-[5px] border border-[#76baff] bg-[#071832] px-2.5 py-[7px] text-[10px] font-extrabold text-white ${busyClass}`} type="button" onClick={copyCode}>
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
    <form className={`${panelBase} mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[18px] border-[#7b3437] p-[19px_24px] max-[700px]:grid-cols-1`} action={formAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div>
        <strong className="text-[13px] text-[#ffb4b4] light:text-(--status-error-text)">Leave this workspace</strong>
        <p className="mt-1 mb-0 text-[11px] text-[#c4a9ad] light:text-(--text-muted)">You will need another Professor invitation to rejoin.</p>
      </div>
      <button className={`transition-colors duration-160 not-disabled:hover:bg-[rgba(160,32,32,0.32)] cursor-pointer rounded-[6px] border border-[#d45b60] bg-[rgba(160,32,32,0.2)] px-3.5 py-2.5 font-extrabold text-[#ffb4b4] light:text-(--status-error-text) ${busyClass}`} type="button" disabled={pending} onClick={() => setConfirming(true)}>
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

