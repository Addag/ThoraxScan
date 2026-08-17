"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AppRole, ProfessorApplicationStatus } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceActionState } from "@/lib/workspaces/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invitationCodePattern = /^[A-Za-z0-9_-]{22}$/;
const millisecondsPerDay = 86_400_000;

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function errorState(message: string): WorkspaceActionState {
  return { status: "error", message };
}

function unauthorizedState(): WorkspaceActionState {
  return {
    status: "unauthorized",
    message: "You are not permitted to perform this action.",
  };
}

async function getProfessorSession() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle<{ id: string; role: AppRole }>();

  if (profileError || profile?.role !== "professor") return null;

  const { data: application, error: applicationError } = await supabase
    .from("professor_applications")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle<{ status: ProfessorApplicationStatus }>();

  if (applicationError || application?.status !== "approved") return null;
  return { supabase, userId };
}

async function getProfessorAccess(
  session: NonNullable<Awaited<ReturnType<typeof getProfessorSession>>>,
  workspaceId: string,
) {
  const [workspaceResult, membershipResult] = await Promise.all([
    session.supabase
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", workspaceId)
      .maybeSingle<{ id: string; owner_id: string }>(),
    session.supabase
      .from("workspace_members")
      .select("workspace_id, user_id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", session.userId)
      .eq("role", "professor")
      .maybeSingle<{ workspace_id: string; user_id: string; role: "professor" }>(),
  ]);

  if (
    workspaceResult.error ||
    membershipResult.error ||
    !workspaceResult.data ||
    !membershipResult.data
  ) {
    return null;
  }

  return {
    workspace: workspaceResult.data,
    isOwner: workspaceResult.data.owner_id === session.userId,
  };
}

export async function createWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const name = value(formData, "name");
  if (name.length < 3 || name.length > 100) {
    return {
      status: "error",
      message: "Check the workspace name.",
      fieldErrors: { name: "Use between 3 and 100 characters." },
    };
  }

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();

  const { error } = await session.supabase.from("workspaces").insert({
    name,
    owner_id: session.userId,
  });

  if (error) return errorState("Unable to create the workspace.");
  revalidatePath("/professor");
  return { status: "success", message: "Workspace created." };
}

export async function renameWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const workspaceId = value(formData, "workspaceId");
  const name = value(formData, "name");
  if (!uuidPattern.test(workspaceId)) return unauthorizedState();
  if (name.length < 3 || name.length > 100) {
    return {
      status: "error",
      message: "Check the workspace name.",
      fieldErrors: { name: "Use between 3 and 100 characters." },
    };
  }

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();
  const access = await getProfessorAccess(session, workspaceId);
  if (!access?.isOwner) return unauthorizedState();

  const { error } = await session.supabase
    .from("workspaces")
    .update({ name })
    .eq("id", access.workspace.id);

  if (error) return errorState("Unable to rename the workspace.");
  revalidatePath("/professor");
  revalidatePath(`/professor/workspaces/${workspaceId}`);
  return { status: "success", message: "Workspace renamed." };
}

export async function createInvitationAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const workspaceId = value(formData, "workspaceId");
  const invitedRole = value(formData, "invitedRole");
  const expiresInDays = Number(value(formData, "expiresInDays"));
  const requestedMaxUses = Number(value(formData, "maxUses"));

  if (!uuidPattern.test(workspaceId)) return unauthorizedState();
  if (invitedRole !== "student" && invitedRole !== "professor") {
    return unauthorizedState();
  }

  const fieldErrors: WorkspaceActionState["fieldErrors"] = {};
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
    fieldErrors.expiresInDays = "Choose 1 to 30 days.";
  }
  if (
    invitedRole === "student" &&
    (!Number.isInteger(requestedMaxUses) ||
      requestedMaxUses < 1 ||
      requestedMaxUses > 500)
  ) {
    fieldErrors.maxUses = "Choose 1 to 500 uses.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the invitation settings.", fieldErrors };
  }

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();
  const access = await getProfessorAccess(session, workspaceId);
  if (!access || (invitedRole === "professor" && !access.isOwner)) {
    return unauthorizedState();
  }

  const plaintextCode = randomBytes(16).toString("base64url");
  const codeHash = createHash("sha256")
    .update(plaintextCode, "utf8")
    .digest("hex");
  const maxUses = invitedRole === "professor" ? 1 : requestedMaxUses;
  const expiresAt = new Date(Date.now() + expiresInDays * millisecondsPerDay);

  const { error } = await session.supabase.from("invitation_codes").insert({
    workspace_id: access.workspace.id,
    created_by: session.userId,
    code_hash: codeHash,
    invited_role: invitedRole,
    expires_at: expiresAt.toISOString(),
    max_uses: maxUses,
  });

  if (error) return errorState("Unable to create the invitation.");
  revalidatePath(`/professor/workspaces/${workspaceId}`);
  return {
    status: "success",
    message: "Invitation created. Copy it now; it cannot be recovered later.",
    invitationCode: plaintextCode,
  };
}

export async function revokeInvitationAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const invitationId = value(formData, "invitationId");
  if (!uuidPattern.test(invitationId)) return unauthorizedState();

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();

  const { data: invitation, error: invitationError } = await session.supabase
    .from("invitation_codes")
    .select("id, workspace_id, invited_role, is_active")
    .eq("id", invitationId)
    .maybeSingle<{
      id: string;
      workspace_id: string;
      invited_role: AppRole;
      is_active: boolean;
    }>();

  if (invitationError || !invitation) return unauthorizedState();
  const access = await getProfessorAccess(session, invitation.workspace_id);
  if (!access || (invitation.invited_role === "professor" && !access.isOwner)) {
    return unauthorizedState();
  }
  if (!invitation.is_active) {
    return { status: "success", message: "Invitation is already revoked." };
  }

  const { error } = await session.supabase
    .from("invitation_codes")
    .update({ is_active: false })
    .eq("id", invitation.id);

  if (error) return errorState("Unable to revoke the invitation.");
  revalidatePath(`/professor/workspaces/${invitation.workspace_id}`);
  return { status: "success", message: "Invitation revoked." };
}

export async function redeemInvitationAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const code = value(formData, "code");
  if (!invitationCodePattern.test(code)) {
    return {
      status: "error",
      message: "This invitation code is not valid.",
      fieldErrors: { code: "Enter the complete 22-character code." },
    };
  }

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();
  const codeHash = createHash("sha256").update(code, "utf8").digest("hex");
  const { data, error } = await session.supabase.rpc(
    "redeem_workspace_invitation",
    { code_hash: codeHash },
  );

  if (error) return errorState("Unable to join the workspace.");
  if (data === "joined" || data === "already_member") {
    revalidatePath("/professor");
    return {
      status: "success",
      message:
        data === "joined"
          ? "Workspace joined."
          : "You already belong to this workspace.",
    };
  }
  if (data === "expired_code") {
    return { status: "expired", message: "This invitation code has expired." };
  }
  if (data === "revoked_code") {
    return { status: "revoked", message: "This invitation code was revoked." };
  }
  if (data === "unauthorized") return unauthorizedState();
  return errorState(
    data === "exhausted_code"
      ? "This invitation code has already been used."
      : "This invitation code is not valid.",
  );
}

export async function removeMemberAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const workspaceId = value(formData, "workspaceId");
  const memberUserId = value(formData, "memberUserId");
  if (!uuidPattern.test(workspaceId) || !uuidPattern.test(memberUserId)) {
    return unauthorizedState();
  }

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();
  const access = await getProfessorAccess(session, workspaceId);
  if (!access || memberUserId === session.userId) return unauthorizedState();

  const { data: target, error: targetError } = await session.supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role")
    .eq("workspace_id", access.workspace.id)
    .eq("user_id", memberUserId)
    .maybeSingle<{ workspace_id: string; user_id: string; role: AppRole }>();

  if (targetError || !target || target.user_id === access.workspace.owner_id) {
    return unauthorizedState();
  }
  if (target.role === "professor" && !access.isOwner) return unauthorizedState();

  const { error } = await session.supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", target.workspace_id)
    .eq("user_id", target.user_id);

  if (error) return errorState("Unable to remove the member.");
  revalidatePath("/professor");
  revalidatePath(`/professor/workspaces/${workspaceId}`);
  return { status: "success", message: "Member removed." };
}

export async function leaveWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const workspaceId = value(formData, "workspaceId");
  if (!uuidPattern.test(workspaceId)) return unauthorizedState();

  const session = await getProfessorSession();
  if (!session) return unauthorizedState();
  const access = await getProfessorAccess(session, workspaceId);
  if (!access || access.isOwner) return unauthorizedState();

  const { error } = await session.supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", access.workspace.id)
    .eq("user_id", session.userId);

  if (error) return errorState("Unable to leave the workspace.");
  revalidatePath("/professor");
  redirect("/professor");
}
