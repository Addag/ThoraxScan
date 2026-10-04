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
import { primaryButton } from "@/components/primary-button";
import type { AppRole } from "@/lib/auth/types";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
} from "@/lib/workspaces/types";

function FormStatus({ state }: { state: WorkspaceActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`professor-form-status professor-form-status--${state.status}`}
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
    <form className="professor-action-form" action={formAction} noValidate>
      <label htmlFor="new-workspace-name">Workspace name</label>
      <p>Create a class space that you own and manage.</p>
      <div className="professor-action-form__controls">
        <input
          id="new-workspace-name"
          name="name"
          type="text"
          minLength={3}
          maxLength={100}
          placeholder="e.g. RAD 302 — Section A"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <button className={`${primaryButton} min-h-[43px] px-[17px] max-[700px]:w-full`} type="submit" disabled={pending}>
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
    <form className="professor-action-form" action={formAction} noValidate>
      <label htmlFor="professor-invitation-code">Professor invitation code</label>
      <p>Join a workspace as a co-professor.</p>
      <div className="professor-action-form__controls">
        <input
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
        <button className={`${primaryButton} min-h-[43px] px-[17px] max-[700px]:w-full`} type="submit" disabled={pending}>
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
    <form className="professor-rename-form" action={formAction} noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label htmlFor="rename-workspace">Workspace name</label>
      <div>
        <input
          id="rename-workspace"
          name="name"
          type="text"
          defaultValue={currentName}
          minLength={3}
          maxLength={100}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <button className="secondary-button" type="submit" disabled={pending}>
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
    <form className="professor-invitation-form" action={formAction} noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="invitedRole" value={invitedRole} />
      <div className="professor-invitation-form__fields">
        <label>
          Expires in
          <span>
            <input
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
          <label>
            Maximum uses
            <input
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
      <button className={`${primaryButton} min-h-[43px] px-[17px] max-[700px]:w-full`} type="submit" disabled={pending}>
        {pending
          ? "Generating…"
          : `Generate ${isStudent ? "Student" : "Professor"} code`}
      </button>
      <FormStatus state={state} />
      {state.invitationCode && (
        <div className="professor-copy-result" role="status">
          <strong>Copy this code now</strong>
          <code>{state.invitationCode}</code>
          <button type="button" onClick={copyCode}>
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
  return (
    <form className="professor-inline-action" action={formAction}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <button type="submit" disabled={pending}>
        {pending ? "Revoking…" : "Revoke"}
      </button>
      <FormStatus state={state} />
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
  return (
    <form className="professor-inline-action" action={formAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="memberUserId" value={memberUserId} />
      <button type="submit" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </button>
      <FormStatus state={state} />
    </form>
  );
}

export function LeaveWorkspaceForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction, pending] = useActionState(
    leaveWorkspaceAction,
    initialWorkspaceActionState,
  );
  return (
    <form className="professor-leave-form" action={formAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div>
        <strong>Leave this workspace</strong>
        <p>You will need another Professor invitation to rejoin.</p>
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Leaving…" : "Leave workspace"}
      </button>
      <FormStatus state={state} />
    </form>
  );
}

