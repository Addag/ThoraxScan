"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";

import type {
  ActivityFormState,
  ActivityStatus,
  CaseUploadFormState,
  CaseRemovalFormState,
  CaseUploadStatus,
} from "@/lib/activities/types";
import type { AppRole, ProfessorApplicationStatus } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedMimeTypes = new Set(["image/jpeg", "image/png"]);
const maximumCaseBytes = 6 * 1024 * 1024;

type ActivityAccessRow = {
  id: string;
  workspace_id: string;
  case_id: string | null;
  status: ActivityStatus;
  due_at: string | null;
};

type CaseAccessRow = {
  id: string;
  workspace_id: string;
  storage_path: string;
  mime_type: string;
  byte_size: number;
  upload_status: CaseUploadStatus;
};

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function activityError(message: string): ActivityFormState {
  return { status: "error", message };
}

function activityUnauthorized(): ActivityFormState {
  return {
    status: "unauthorized",
    message: "You are not permitted to manage this activity.",
  };
}

function caseError(message: string): CaseUploadFormState {
  return { status: "error", message };
}

function caseUnauthorized(): CaseUploadFormState {
  return {
    status: "unauthorized",
    message: "You are not permitted to upload a case for this activity.",
  };
}

function validateActivityFields(formData: FormData) {
  const workspaceId = value(formData, "workspaceId");
  const title = value(formData, "title");
  const instructions = value(formData, "instructions");
  const referenceEvaluation = value(formData, "referenceEvaluation");
  const dueDate = value(formData, "dueAt");
  const fieldErrors: NonNullable<ActivityFormState["fieldErrors"]> = {};

  if (!uuidPattern.test(workspaceId)) fieldErrors.workspaceId = "Select a workspace.";
  if (title.length < 3 || title.length > 100) {
    fieldErrors.title = "Use between 3 and 100 characters.";
  }
  if (instructions.length < 10 || instructions.length > 5000) {
    fieldErrors.instructions = "Use between 10 and 5,000 characters.";
  }
  if (referenceEvaluation.length > 5000) {
    fieldErrors.referenceEvaluation = "Use no more than 5,000 characters.";
  }

  let dueAt: string | null = null;
  if (dueDate) {
    const parsed = new Date(`${dueDate}T23:59:59.999Z`);
    if (Number.isNaN(parsed.getTime())) {
      fieldErrors.dueAt = "Enter a valid due date.";
    } else {
      dueAt = parsed.toISOString();
    }
  }

  return {
    values: { workspaceId, title, instructions, referenceEvaluation, dueAt },
    fieldErrors,
  };
}

async function getProfessorSession() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const [profileResult, applicationResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle<{ id: string; role: AppRole }>(),
    supabase
      .from("professor_applications")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle<{ status: ProfessorApplicationStatus }>(),
  ]);

  if (
    profileResult.error ||
    applicationResult.error ||
    profileResult.data?.role !== "professor" ||
    applicationResult.data?.status !== "approved"
  ) {
    return null;
  }

  return { supabase, userId };
}

async function hasProfessorWorkspaceAccess(
  session: NonNullable<Awaited<ReturnType<typeof getProfessorSession>>>,
  workspaceId: string,
) {
  const { data, error } = await session.supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", session.userId)
    .eq("role", "professor")
    .maybeSingle<{ workspace_id: string }>();

  return !error && Boolean(data);
}

async function getActivityAccess(
  session: NonNullable<Awaited<ReturnType<typeof getProfessorSession>>>,
  activityId: string,
) {
  const { data: activity, error } = await session.supabase
    .from("activities")
    .select("id, workspace_id, case_id, status, due_at")
    .eq("id", activityId)
    .maybeSingle<ActivityAccessRow>();

  if (error || !activity) return null;
  if (!(await hasProfessorWorkspaceAccess(session, activity.workspace_id))) return null;
  return activity;
}

async function getCase(
  session: NonNullable<Awaited<ReturnType<typeof getProfessorSession>>>,
  caseId: string,
) {
  const { data, error } = await session.supabase
    .from("xray_cases")
    .select("id, workspace_id, storage_path, mime_type, byte_size, upload_status")
    .eq("id", caseId)
    .maybeSingle<CaseAccessRow>();

  return error ? null : data;
}

function revalidateActivityPaths(activityId?: string, workspaceId?: string) {
  revalidatePath("/professor");
  revalidatePath("/professor/activities");
  revalidatePath("/student");
  revalidatePath("/student/activities");
  if (activityId) {
    revalidatePath(`/professor/activities/${activityId}`);
    revalidatePath(`/student/activities/${activityId}`);
  }
  if (workspaceId) {
    revalidatePath(`/professor/workspaces/${workspaceId}`);
    revalidatePath(`/student/workspaces/${workspaceId}`);
  }
}

export async function createActivityDraftAction(
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const { values, fieldErrors } = validateActivityFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the activity details.", fieldErrors };
  }

  const session = await getProfessorSession();
  if (!session) return activityUnauthorized();
  if (!(await hasProfessorWorkspaceAccess(session, values.workspaceId))) {
    return activityUnauthorized();
  }

  const { data: activity, error: activityInsertError } = await session.supabase
    .from("activities")
    .insert({
      workspace_id: values.workspaceId,
      created_by: session.userId,
      title: values.title,
      instructions: values.instructions,
      due_at: values.dueAt,
    })
    .select("id")
    .single<{ id: string }>();

  if (activityInsertError || !activity) return activityError("Unable to create the draft.");

  const { error: referenceInsertError } = await session.supabase
    .from("activity_reference_evaluations")
    .insert({ activity_id: activity.id, evaluation: values.referenceEvaluation });

  if (referenceInsertError) {
    await session.supabase.from("activities").delete().eq("id", activity.id);
    return activityError("Unable to save the reference evaluation.");
  }

  revalidateActivityPaths(activity.id, values.workspaceId);
  redirect(`/professor/activities/${activity.id}`);
}

export async function updateActivityAction(
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const activityId = value(formData, "activityId");
  if (!uuidPattern.test(activityId)) return activityUnauthorized();

  const { values, fieldErrors } = validateActivityFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the activity details.", fieldErrors };
  }

  const session = await getProfessorSession();
  if (!session) return activityUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.workspace_id !== values.workspaceId) return activityUnauthorized();
  if (activity.status === "archived") return activityError("Archived activities cannot be edited.");

  const { error: activityUpdateError } = await session.supabase
    .from("activities")
    .update({
      title: values.title,
      instructions: values.instructions,
      due_at: values.dueAt,
    })
    .eq("id", activity.id)
    .eq("workspace_id", activity.workspace_id);

  if (activityUpdateError) return activityError("Unable to update the activity.");

  const { error: referenceUpdateError } = await session.supabase
    .from("activity_reference_evaluations")
    .update({ evaluation: values.referenceEvaluation })
    .eq("activity_id", activity.id);

  if (referenceUpdateError) return activityError("The activity changed, but the reference evaluation did not save.");

  revalidateActivityPaths(activity.id, activity.workspace_id);
  return { status: "success", message: "Activity saved." };
}

export async function prepareCaseUploadAction(
  _previousState: CaseUploadFormState,
  formData: FormData,
): Promise<CaseUploadFormState> {
  const activityId = value(formData, "activityId");
  const mimeType = value(formData, "mimeType");
  const byteSize = Number(value(formData, "byteSize"));
  const attested = value(formData, "attestation") === "on";
  const fieldErrors: NonNullable<CaseUploadFormState["fieldErrors"]> = {};

  if (!allowedMimeTypes.has(mimeType) || !Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > maximumCaseBytes) {
    fieldErrors.file = "Choose a JPEG or PNG image no larger than 6 MB.";
  }
  if (!attested) {
    fieldErrors.attestation = "Confirm that the image is de-identified and frontal-view.";
  }
  if (!uuidPattern.test(activityId)) return caseUnauthorized();
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the case image.", fieldErrors };
  }

  const session = await getProfessorSession();
  if (!session) return caseUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.status !== "draft") return caseUnauthorized();

  if (activity.case_id) {
    const oldCase = await getCase(session, activity.case_id);
    if (oldCase) {
      const { error: storageRemoveError } = await session.supabase.storage
        .from("activity-cases")
        .remove([oldCase.storage_path]);
      if (storageRemoveError) return caseError("Unable to replace the existing case image.");

      const { error: unlinkError } = await session.supabase
        .from("activities")
        .update({ case_id: null })
        .eq("id", activity.id)
        .eq("status", "draft");
      if (unlinkError) return caseError("Unable to replace the existing case image.");

      const { error: caseDeleteError } = await session.supabase
        .from("xray_cases")
        .delete()
        .eq("id", oldCase.id);
      if (caseDeleteError) return caseError("Unable to replace the existing case image.");
    }
  }

  const caseId = randomUUID();
  const path = `${activity.workspace_id}/${caseId}`;
  const { error: caseInsertError } = await session.supabase.from("xray_cases").insert({
    id: caseId,
    workspace_id: activity.workspace_id,
    storage_path: path,
    uploaded_by: session.userId,
    view_position: "frontal",
    mime_type: mimeType,
    byte_size: byteSize,
    upload_status: "pending",
    attested_by: session.userId,
  });

  if (caseInsertError) return caseError("Unable to reserve storage for this image.");

  const { error: attachError } = await session.supabase
    .from("activities")
    .update({ case_id: caseId })
    .eq("id", activity.id)
    .eq("status", "draft");

  if (attachError) {
    await session.supabase.from("xray_cases").delete().eq("id", caseId);
    return caseError("Unable to attach the reserved case to this draft.");
  }

  const { data: signedUpload, error: signedUploadError } = await session.supabase.storage
    .from("activity-cases")
    .createSignedUploadUrl(path, { upsert: false });

  if (signedUploadError || !signedUpload) {
    return caseError("Unable to authorize the upload. The draft is still available to retry.");
  }

  return {
    status: "prepared",
    message: "Storage reserved. Uploading directly to the private case bucket…",
    activityId: activity.id,
    caseId,
    path: signedUpload.path,
    token: signedUpload.token,
    expectedMimeType: mimeType,
  };
}

export async function confirmCaseUploadAction(
  _previousState: CaseUploadFormState,
  formData: FormData,
): Promise<CaseUploadFormState> {
  const activityId = value(formData, "activityId");
  const caseId = value(formData, "caseId");
  if (!uuidPattern.test(activityId) || !uuidPattern.test(caseId)) return caseUnauthorized();

  const session = await getProfessorSession();
  if (!session) return caseUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.status !== "draft" || activity.case_id !== caseId) {
    return caseUnauthorized();
  }

  const xrayCase = await getCase(session, caseId);
  if (!xrayCase || xrayCase.workspace_id !== activity.workspace_id || xrayCase.upload_status !== "pending") {
    return caseUnauthorized();
  }

  const { data: uploadedObject, error: downloadError } = await session.supabase.storage
    .from("activity-cases")
    .download(xrayCase.storage_path);

  if (downloadError || !uploadedObject) {
    return caseError("The uploaded object could not be read. Choose the file and retry.");
  }

  try {
    const imageBytes = Buffer.from(await uploadedObject.arrayBuffer());
    const image = sharp(imageBytes, { failOn: "warning", limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      (metadata.format !== "jpeg" && metadata.format !== "png")
    ) {
      throw new Error("Unsupported image structure");
    }
    await image.resize({ width: 1, height: 1, fit: "inside" }).toBuffer();
  } catch {
    await session.supabase.storage.from("activity-cases").remove([xrayCase.storage_path]);
    return caseError("The file is not a valid, decodable JPEG or PNG. Choose a different image.");
  }

  const { data: confirmationStatus, error: confirmationError } = await session.supabase
    .rpc("confirm_activity_case_upload", { target_case_id: xrayCase.id });

  if (confirmationError) {
    return caseError("The image uploaded, but confirmation failed. Retry the confirmation.");
  }

  if (confirmationStatus !== "ready") {
    await session.supabase.storage.from("activity-cases").remove([xrayCase.storage_path]);
    return caseError(
      confirmationStatus === "missing_object"
        ? "The uploaded object could not be confirmed. Choose the file and retry."
        : "The uploaded object did not match the approved JPEG/PNG metadata. Choose the file again.",
    );
  }

  revalidateActivityPaths(activity.id, activity.workspace_id);
  return { status: "success", message: "Case image uploaded and verified." };
}

export async function removeActivityCaseAction(
  previousState: CaseRemovalFormState,
  formData: FormData,
): Promise<CaseRemovalFormState> {
  const activityId = value(formData, "activityId");
  const caseId = value(formData, "caseId");
  if (!uuidPattern.test(activityId) || !uuidPattern.test(caseId)) return activityUnauthorized();

  const session = await getProfessorSession();
  if (!session) return activityUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.status !== "draft") return activityUnauthorized();

  const retryingCleanup = previousState.cleanupCaseId === caseId;
  if (!retryingCleanup && activity.case_id !== caseId) {
    return activityError("The draft case changed. Reload before removing it.");
  }

  // Read errors must not be mistaken for an already deleted case.
  const { data: xrayCase, error: caseReadError } = await session.supabase
    .from("xray_cases")
    .select("id, workspace_id, storage_path, mime_type, byte_size, upload_status")
    .eq("id", caseId)
    .maybeSingle<CaseAccessRow>();
  if (caseReadError) return { ...previousState, status: "error", message: "Unable to read the case. Try again." };
  if (!xrayCase) {
    if (retryingCleanup) return { status: "success", message: "Case image removed.", removedCaseId: caseId };
    return activityError("The case is unavailable. Reload before removing it.");
  }
  if (xrayCase.workspace_id !== activity.workspace_id) return activityUnauthorized();

  if (!retryingCleanup) {
    const { data: detached, error: detachError } = await session.supabase
      .from("activities")
      .update({ case_id: null })
      .eq("id", activity.id)
      .eq("workspace_id", activity.workspace_id)
      .eq("status", "draft")
      .eq("case_id", caseId)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (detachError || !detached) return activityError("The draft case changed or could not be removed. Reload and try again.");
    revalidateActivityPaths(activity.id, activity.workspace_id);
  }

  const cleanupPending = (message: string): CaseRemovalFormState => ({
    status: "cleanup_pending", message, removedCaseId: caseId, cleanupCaseId: caseId,
  });
  const { data: linkedActivity, error: linkReadError } = await session.supabase
    .from("activities")
    .select("id")
    .eq("case_id", caseId)
    .maybeSingle<{ id: string }>();
  if (linkReadError) return cleanupPending("The case was detached, but cleanup could not be checked. Retry cleanup.");
  if (linkedActivity) return activityError("This case is attached to an activity and cannot be cleaned up. Reload the page.");

  const { error: storageError } = await session.supabase.storage
    .from("activity-cases")
    .remove([xrayCase.storage_path]);
  if (storageError) return cleanupPending("The case was detached, but its image could not be deleted. Retry cleanup.");

  const { data: deleted, error: deleteError } = await session.supabase
    .from("xray_cases")
    .delete()
    .eq("id", caseId)
    .eq("workspace_id", activity.workspace_id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (deleteError || !deleted) return cleanupPending("The case was detached, but its record could not be deleted. Retry cleanup.");

  revalidateActivityPaths(activity.id, activity.workspace_id);
  return { status: "success", message: "Case image removed. You can upload another image.", removedCaseId: caseId };
}

export async function publishActivityAction(
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const activityId = value(formData, "activityId");
  if (!uuidPattern.test(activityId)) return activityUnauthorized();

  const session = await getProfessorSession();
  if (!session) return activityUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.status !== "draft") return activityUnauthorized();

  const [caseRow, referenceResult] = await Promise.all([
    activity.case_id ? getCase(session, activity.case_id) : Promise.resolve(null),
    session.supabase
      .from("activity_reference_evaluations")
      .select("evaluation")
      .eq("activity_id", activity.id)
      .maybeSingle<{ evaluation: string }>(),
  ]);

  if (caseRow?.upload_status !== "ready") return activityError("Upload and verify a frontal JPEG or PNG before publishing.");
  if (!referenceResult.data?.evaluation) return activityError("Add the private reference evaluation before publishing.");
  if (activity.due_at && new Date(activity.due_at).getTime() <= Date.now()) {
    return activityError("Choose a future due date or remove the due date before publishing.");
  }

  const { error } = await session.supabase
    .from("activities")
    .update({ status: "published" })
    .eq("id", activity.id)
    .eq("status", "draft");

  if (error) return activityError("Unable to publish the activity. Check all required fields and try again.");
  revalidateActivityPaths(activity.id, activity.workspace_id);
  return { status: "success", message: "Activity published to the workspace." };
}

export async function archiveActivityAction(
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const activityId = value(formData, "activityId");
  if (!uuidPattern.test(activityId)) return activityUnauthorized();

  const session = await getProfessorSession();
  if (!session) return activityUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.status !== "published") return activityUnauthorized();

  const { error } = await session.supabase
    .from("activities")
    .update({ status: "archived" })
    .eq("id", activity.id)
    .eq("status", "published");

  if (error) return activityError("Unable to archive the activity.");
  revalidateActivityPaths(activity.id, activity.workspace_id);
  return { status: "success", message: "Activity archived. This cannot be undone." };
}

export async function deleteDraftActivityAction(
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const activityId = value(formData, "activityId");
  if (!uuidPattern.test(activityId)) return activityUnauthorized();

  const session = await getProfessorSession();
  if (!session) return activityUnauthorized();
  const activity = await getActivityAccess(session, activityId);
  if (!activity || activity.status !== "draft") return activityUnauthorized();

  const xrayCase = activity.case_id ? await getCase(session, activity.case_id) : null;
  if (xrayCase) {
    const { error: storageError } = await session.supabase.storage
      .from("activity-cases")
      .remove([xrayCase.storage_path]);
    if (storageError) return activityError("Unable to remove the draft case object.");
  }

  const { error: activityDeleteError } = await session.supabase
    .from("activities")
    .delete()
    .eq("id", activity.id)
    .eq("status", "draft");
  if (activityDeleteError) return activityError("Unable to delete the draft.");

  if (xrayCase) {
    const { error: caseDeleteError } = await session.supabase
      .from("xray_cases")
      .delete()
      .eq("id", xrayCase.id);
    if (caseDeleteError) return activityError("The draft was deleted, but its case record needs cleanup.");
  }

  revalidateActivityPaths(undefined, activity.workspace_id);
  redirect("/professor/activities");
}
