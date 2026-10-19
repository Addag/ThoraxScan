"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";

import {
  archiveActivityAction,
  confirmCaseUploadAction,
  createActivityDraftAction,
  deleteDraftActivityAction,
  prepareCaseUploadAction,
  publishActivityAction,
  removeActivityCaseAction,
  updateActivityAction,
} from "@/app/(protected)/professor/activities/actions";
import {
  initialActivityFormState,
  initialCaseUploadFormState,
  initialCaseRemovalFormState,
  type ProfessorActivityDetails,
} from "@/lib/activities/types";
import { createClient } from "@/lib/supabase/client";
import type { ProfessorWorkspace } from "@/lib/workspaces/types";
import { XrayLibrary } from "@/components/learning/xray-library";
import { activityButton } from "@/components/activities/activity-button";
import { activityFormHeadingClass, activityFormHeadingIconClass, activityFormHeadingKickerClass, activityFormHeadingTitleClass, activityFormMessageClass } from "@/components/activities/activity-form-styles";

function FieldError({ children }: { children?: string }) {
  return children ? <small className="text-[10px] text-[#ff7c85]">{children}</small> : null;
}

export function ActivityDetailsForm({
  workspaces,
  activity,
}: {
  workspaces: ProfessorWorkspace[];
  activity?: ProfessorActivityDetails;
}) {
  const isEditing = Boolean(activity);
  const action = isEditing ? updateActivityAction : createActivityDraftAction;
  const [state, formAction, pending] = useActionState(action, initialActivityFormState);
  const isArchived = activity?.status === "archived";

  return (
    <form className="rounded-[10px] border border-[#33425c] [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-[22px] max-[520px]:p-[17px]" action={formAction}>
      {activity ? <input type="hidden" name="activityId" value={activity.id} /> : null}
      <div className={activityFormHeadingClass}>
        <span className={activityFormHeadingIconClass} aria-hidden="true">➤</span>
        <div>
          <p className={activityFormHeadingKickerClass}>{isEditing ? "Activity configuration" : "New activity"}</p>
          <h2 className={activityFormHeadingTitleClass}>{isEditing ? "Configure" : "Create a draft"}</h2>
        </div>
      </div>

      <label className="mt-3.5 grid gap-[7px] text-[12px] text-[#a1a7b1]">
        Workspace
        {activity ? (
          <>
            <input type="hidden" name="workspaceId" value={activity.workspaceId} />
            <input className="w-full min-h-[42px] rounded-[5px] border border-[#82878e] bg-[#202938] px-3 py-[11px] text-white disabled:opacity-[0.52]" value={activity.workspaceName} disabled />
          </>
        ) : (
          <select className="w-full min-h-[42px] rounded-[5px] border border-[#82878e] bg-[#202938] px-3 py-[11px] text-white disabled:opacity-[0.52]" name="workspaceId" defaultValue="" aria-invalid={Boolean(state.fieldErrors?.workspaceId)}>
            <option value="" disabled>Select a teaching workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
            ))}
          </select>
        )}
        <FieldError>{state.fieldErrors?.workspaceId}</FieldError>
      </label>

      <label className="mt-3.5 grid gap-[7px] text-[12px] text-[#a1a7b1]">
        Activity title
        <input
          className="w-full min-h-[42px] rounded-[5px] border border-[#82878e] bg-[#202938] px-3 py-[11px] text-white disabled:opacity-[0.52]"
          name="title"
          minLength={3}
          maxLength={100}
          defaultValue={activity?.title}
          disabled={isArchived}
          required
          aria-invalid={Boolean(state.fieldErrors?.title)}
        />
        <FieldError>{state.fieldErrors?.title}</FieldError>
      </label>

      <label className="mt-3.5 grid gap-[7px] text-[12px] text-[#a1a7b1]">
        Instructions for students
        <textarea
          className="w-full resize-y rounded-[5px] border border-[#82878e] bg-[#202938] px-3 py-[11px] leading-[1.45] text-white disabled:opacity-[0.52]"
          name="instructions"
          minLength={10}
          maxLength={5000}
          rows={6}
          defaultValue={activity?.instructions}
          disabled={isArchived}
          required
          aria-invalid={Boolean(state.fieldErrors?.instructions)}
        />
        <FieldError>{state.fieldErrors?.instructions}</FieldError>
      </label>

      <label className="mt-3.5 grid gap-[7px] text-[12px] text-[#a1a7b1] [&>small:first-child]:text-[#aeb6c5]">
        Due date <small>Optional</small>
        <input
          className="w-full min-h-[42px] rounded-[5px] border border-[#82878e] bg-[#202938] px-3 py-[11px] text-white disabled:opacity-[0.52]"
          type="date"
          name="dueAt"
          defaultValue={activity?.dueAt?.slice(0, 10)}
          disabled={isArchived}
          aria-invalid={Boolean(state.fieldErrors?.dueAt)}
        />
        <FieldError>{state.fieldErrors?.dueAt}</FieldError>
      </label>

      <label className="mt-3.5 grid gap-[7px] text-[12px] text-[#a1a7b1]">
        Private reference evaluation
        <textarea
          className="w-full resize-y rounded-[5px] border border-[#82878e] bg-[#202938] px-3 py-[11px] leading-[1.45] text-white disabled:opacity-[0.52]"
          name="referenceEvaluation"
          maxLength={5000}
          rows={8}
          defaultValue={activity?.referenceEvaluation}
          disabled={isArchived}
          aria-invalid={Boolean(state.fieldErrors?.referenceEvaluation)}
        />
        <span className="text-[10px] text-[#aeb6c5]">Visible to teaching staff only. Required before publishing.</span>
        <FieldError>{state.fieldErrors?.referenceEvaluation}</FieldError>
      </label>

      {!isArchived ? (
        <button className={`${activityButton.primary} mt-5 w-full`} type="submit" disabled={pending}>
          {pending ? "Saving…" : isEditing ? "Save changes" : "Create draft"}
        </button>
      ) : null}
      {state.message ? <p className={activityFormMessageClass(state.status)} role="status">{state.message}</p> : null}
    </form>
  );
}

export function CaseUploadForm({ activityId, caseId = null }: { activityId: string; caseId?: string | null }) {
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [reservedCase, setReservedCase] = useState<{ id: string; previousCaseId: string | null } | null>(null);
  const handleCaseReserved = useCallback((id: string) => {
    setReservedCase({ id, previousCaseId: caseId });
  }, [caseId]);
  const [removalState, removeAction, removing] = useActionState(async (previousState: typeof initialCaseRemovalFormState, formData: FormData) => {
    const result = await removeActivityCaseAction(previousState, formData);
    if (result.removedCaseId && !previousState.cleanupCaseId && (result.status === "success" || result.status === "cleanup_pending")) {
      setSelectionVersion((version) => version + 1);
      setSelectionMessage("");
    }
    return result;
  }, initialCaseRemovalFormState);
  const currentCaseId = reservedCase && caseId === reservedCase.previousCaseId ? reservedCase.id : caseId;
  const attachedCaseId = currentCaseId !== removalState.removedCaseId ? currentCaseId : null;
  const removalCaseId = removalState.cleanupCaseId ?? attachedCaseId;

  return (
    <div className="grid min-w-0 gap-3.5">
      {removalCaseId ? (
        <form action={removeAction} onSubmit={(event) => {
          if (uploadBusy || removing || (!removalState.cleanupCaseId && !window.confirm("Remove this case image from the draft? You can upload another image."))) event.preventDefault();
        }}>
          <input type="hidden" name="activityId" value={activityId} />
          <input type="hidden" name="caseId" value={removalCaseId} />
          <button className={`${activityButton.danger} w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80caff]`} type="submit" disabled={uploadBusy || removing}>
            {removing ? "Removing…" : removalState.cleanupCaseId ? "Retry cleanup" : "Remove uploaded case"}
          </button>
        </form>
      ) : null}
      {removalState.message ? <p className={activityFormMessageClass(removalState.status === "cleanup_pending" ? "error" : removalState.status)} role="status">{removalState.message}</p> : null}
      <CaseUploadFields
        key={selectionVersion}
        activityId={activityId}
        disabled={removing}
        onBusyChange={setUploadBusy}
        onCaseReserved={handleCaseReserved}
        onSelect={() => setSelectionMessage("")}
        onClear={() => {
          setSelectionVersion((version) => version + 1);
          setSelectionMessage("Selected case removed.");
        }}
      />
      <p className="m-0 text-[11px] text-[#aeb6c5]" role="status">{selectionMessage}</p>
    </div>
  );
}

function CaseUploadFields({ activityId, disabled, onBusyChange, onCaseReserved, onSelect, onClear }: {
  activityId: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onCaseReserved: (caseId: string) => void;
  onSelect: () => void;
  onClear: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [prepareState, prepareAction, preparing] = useActionState(
    prepareCaseUploadAction,
    initialCaseUploadFormState,
  );
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmCaseUploadAction,
    initialCaseUploadFormState,
  );
  const [, startConfirmation] = useTransition();
  const processedCaseId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  useEffect(() => {
    if (
      prepareState.status !== "prepared" ||
      !prepareState.caseId ||
      !prepareState.path ||
      !prepareState.token ||
      !prepareState.activityId ||
      !file ||
      processedCaseId.current === prepareState.caseId
    ) {
      return;
    }

    processedCaseId.current = prepareState.caseId;
    onCaseReserved(prepareState.caseId);
    let cancelled = false;

    async function upload() {
      setUploading(true);
      setClientError("");
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("activity-cases")
        .uploadToSignedUrl(prepareState.path!, prepareState.token!, file!, {
          contentType: prepareState.expectedMimeType,
          upsert: false,
        });

      if (cancelled) return;
      setUploading(false);
      if (error) {
        setClientError("The direct upload failed. Your draft is safe; choose the file and retry.");
        return;
      }

      const confirmation = new FormData();
      confirmation.set("activityId", prepareState.activityId!);
      confirmation.set("caseId", prepareState.caseId!);
      startConfirmation(() => confirmAction(confirmation));
    }

    void upload();
    return () => {
      cancelled = true;
    };
  }, [confirmAction, file, onCaseReserved, prepareState, startConfirmation]);

  const visibleState = confirmState.status !== "idle" ? confirmState : prepareState;
  const uploadBusy = preparing || uploading || confirming || libraryLoading;
  const busy = disabled || uploadBusy;

  useEffect(() => {
    onBusyChange(uploadBusy);
  }, [onBusyChange, uploadBusy]);

  return (
    <form className="rounded-[10px] border border-[#33425c] [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-[22px] max-[520px]:p-[17px]" action={prepareAction}>
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="mimeType" value={file?.type ?? ""} />
      <input type="hidden" name="byteSize" value={file?.size ?? ""} />
      <XrayLibrary disabled={busy} selectedCaseId={selectedCaseId} onLoadingChange={setLibraryLoading} onSelect={(next, nextCaseId) => {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFile(next);
        setSelectedCaseId(nextCaseId);
        setClientError("");
        onSelect();
      }} />
      <div className="grid min-h-[175px] place-items-center content-center gap-[7px] rounded-[6px] border-2 border-dashed border-[#d1d5db] p-5 text-center">
        <span className="text-[32px] font-light" aria-hidden="true">＋</span>
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-3">
          <label className="min-w-0 cursor-pointer break-all" htmlFor={fileInputId}><strong>{file ? file.name : "Choose a chest X-ray"}</strong></label>
          {file ? (
            <button className={`${activityButton.secondary} text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80caff]`} type="button" disabled={busy} onClick={onClear}>
              Remove selected case
            </button>
          ) : null}
        </div>
        <small className="text-[10px] text-[#8d96a5]">JPEG or PNG · maximum 6 MB · private storage</small>
        <input
          ref={fileInputRef}
          id={fileInputId}
          className="w-full max-w-[250px] text-[10px] text-[#aeb6c5]"
          type="file"
          aria-label="Choose a chest X-ray file"
          accept="image/jpeg,image/png"
          disabled={busy}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setSelectedCaseId(null);
            setClientError("");
            onSelect();
          }}
          required={!file}
        />
      </div>
      <FieldError>{prepareState.fieldErrors?.file}</FieldError>
      <label className="my-4 grid grid-cols-[18px_minmax(0,1fr)] gap-[9px] text-[11px] leading-[1.4] text-[#bdc4cf]">
        <input className="size-4 accent-brand" type="checkbox" name="attestation" disabled={busy} required />
        <span>I attest this is a de-identified image approved for this class activity.</span>
      </label>
      <FieldError>{prepareState.fieldErrors?.attestation}</FieldError>
      <button className={`${activityButton.secondary} w-full`} type="submit" disabled={!file || busy}>
        {preparing ? "Authorizing…" : uploading ? "Uploading directly…" : confirming ? "Verifying…" : "Upload and verify case"}
      </button>
      {clientError ? <p className={activityFormMessageClass("error")} role="alert">{clientError}</p> : null}
      {visibleState.message ? <p className={activityFormMessageClass(visibleState.status)} role="status">{visibleState.message}</p> : null}
    </form>
  );
}

function LifecycleForm({
  activityId,
  action,
  label,
  confirmation,
  danger = false,
}: {
  activityId: string;
  action: typeof publishActivityAction;
  label: string;
  confirmation?: string;
  danger?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialActivityFormState);
  return (
    <form
      className=""
      action={formAction}
      onSubmit={(event) => {
        if (confirmation && !window.confirm(confirmation)) event.preventDefault();
      }}
    >
      <input type="hidden" name="activityId" value={activityId} />
      <button className={`${danger ? activityButton.danger : activityButton.primary} w-full`} type="submit" disabled={pending}>
        {pending ? "Working…" : label}
      </button>
      {state.message ? <p className={activityFormMessageClass(state.status)} role="status">{state.message}</p> : null}
    </form>
  );
}

export function ActivityLifecycleControls({ activity }: { activity: ProfessorActivityDetails }) {
  if (activity.status === "archived") {
    return <p className="m-0 rounded-[7px] border border-[#626b79] bg-[rgba(255,255,255,0.04)] p-3.5 text-[12px] text-[#aeb6c5]">Archived activities are read-only and cannot be restored.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
      {activity.status === "draft" ? (
        <>
          <LifecycleForm activityId={activity.id} action={publishActivityAction} label="Publish activity" />
          <LifecycleForm
            activityId={activity.id}
            action={deleteDraftActivityAction}
            label="Delete draft"
            confirmation="Delete this draft and its private case image? This cannot be undone."
            danger
          />
        </>
      ) : (
        <LifecycleForm
          activityId={activity.id}
          action={archiveActivityAction}
          label="Archive activity"
          confirmation="Archive this activity? Students will lose access and it cannot be restored."
          danger
        />
      )}
    </div>
  );
}
