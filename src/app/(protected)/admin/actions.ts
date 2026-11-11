"use server";

import { revalidatePath } from "next/cache";

import type { AccountOperation, AdminReviewActionState } from "@/lib/admin/types";
import { validatePassword } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function unauthorizedState(): AdminReviewActionState {
  return {
    status: "unauthorized",
    message: "Administrator access is required.",
  };
}

// Returns a client for the signed-in administrator, or null. The RPCs re-check this.
async function adminClient() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const { data: administrator, error: administratorError } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle<{ user_id: string }>();

  return administratorError || !administrator ? null : supabase;
}

export async function reviewProfessorApplicationAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const targetUserId = value(formData, "targetUserId");
  const decision = value(formData, "decision");
  const rejectionReason = value(formData, "rejectionReason");

  if (!uuidPattern.test(targetUserId) || !["approve", "reject"].includes(decision)) {
    return unauthorizedState();
  }

  if (rejectionReason.length > 500) {
    return {
      status: "error",
      message: "Check the rejection reason.",
      fieldErrors: { rejectionReason: "Use 500 characters or fewer." },
    };
  }

  const supabase = await adminClient();
  if (!supabase) return unauthorizedState();

  const { data, error } = await supabase.rpc("review_professor_application", {
    target_user_id: targetUserId,
    decision,
    rejection_reason: rejectionReason || null,
  });

  if (error) {
    return { status: "error", message: "Unable to review the application." };
  }

  if (data === "unauthorized") return unauthorizedState();
  if (data === "email_unconfirmed") {
    return {
      status: "error",
      message: "The applicant must confirm their email before approval.",
    };
  }
  if (data === "has_memberships") {
    return {
      status: "error",
      message: "Remove the applicant's existing workspace memberships before approval.",
    };
  }
  if (data === "reason_too_long") {
    return {
      status: "error",
      message: "Check the rejection reason.",
      fieldErrors: { rejectionReason: "Use 500 characters or fewer." },
    };
  }
  if (["invalid_request", "not_found", "invalid_state", "already_rejected"].includes(String(data))) {
    return {
      status: "error",
      message: "This application is no longer available for that action.",
    };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/professor/application");

  const approved = data === "approved" || data === "already_approved";
  return {
    status: "success",
    message: approved
      ? "Professor access approved."
      : "Professor application rejected.",
  };
}

export async function grantPlatformAdminAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const email = value(formData, "email");

  if (!email.includes("@") || email.length > 254) {
    return {
      status: "error",
      message: "Check the email address.",
      fieldErrors: { email: "Enter the email of an existing ThoraxScan account." },
    };
  }

  const supabase = await adminClient();
  if (!supabase) return unauthorizedState();

  const { data, error } = await supabase.rpc("grant_platform_admin", { target_email: email });

  if (error) return { status: "error", message: "Unable to add the administrator." };
  if (data === "unauthorized") return unauthorizedState();
  if (data === "not_found") {
    return {
      status: "error",
      message: "Check the email address.",
      fieldErrors: { email: "No ThoraxScan account uses this email." },
    };
  }
  if (data === "email_unconfirmed") {
    return {
      status: "error",
      message: "Check the email address.",
      fieldErrors: { email: "This account must confirm its email first." },
    };
  }
  if (data === "already_admin") {
    return { status: "error", message: "This account is already an administrator." };
  }

  revalidatePath("/admin", "layout");
  return { status: "success", message: "Administrator added." };
}

export async function revokePlatformAdminAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const targetUserId = value(formData, "targetUserId");
  if (!uuidPattern.test(targetUserId)) return unauthorizedState();

  const supabase = await adminClient();
  if (!supabase) return unauthorizedState();

  const { data, error } = await supabase.rpc("revoke_platform_admin", {
    target_user_id: targetUserId,
  });

  if (error) return { status: "error", message: "Unable to remove the administrator." };
  if (data === "unauthorized") return unauthorizedState();
  if (data === "self") {
    return { status: "error", message: "You can't remove your own administrator access." };
  }
  if (data === "not_found") {
    return { status: "error", message: "This account is no longer an administrator." };
  }

  revalidatePath("/admin", "layout");
  return { status: "success", message: "Administrator removed." };
}

const accountMessages: Record<string, AdminReviewActionState> = {
  renamed: { status: "success", message: "Name updated." },
  password_set: { status: "success", message: "Temporary password set. The user was signed out everywhere." },
  signed_out: { status: "success", message: "Signed out of every device." },
  disabled: { status: "success", message: "Sign-in disabled. The user was signed out everywhere." },
  enabled: { status: "success", message: "Sign-in enabled." },
  deleted: { status: "success", message: "Account deleted." },
  invalid_name: { status: "error", message: "Check the name.", fieldErrors: { displayName: "Use 1 to 100 characters." } },
  invalid_password: { status: "error", message: "Check the password.", fieldErrors: { password: "Use 8 to 72 characters with a letter and a number." } },
  self: { status: "error", message: "Use your own Settings page for your account." },
  not_found: { status: "error", message: "This account no longer exists." },
  has_records: {
    status: "error",
    message: "This account has workspaces, activities, or submissions, so it can't be deleted. Disable sign-in instead.",
  },
};

const accountRpc: Record<AccountOperation, (target: string, formData: FormData) => [string, Record<string, unknown>]> = {
  rename: (target, formData) => ["admin_rename_account", { target_user_id: target, new_display_name: value(formData, "displayName") }],
  password: (target, formData) => ["admin_set_temporary_password", { target_user_id: target, new_password: String(formData.get("password") ?? "") }],
  signout: (target) => ["admin_sign_out_account", { target_user_id: target }],
  disable: (target) => ["admin_set_account_disabled", { target_user_id: target, disable: true }],
  enable: (target) => ["admin_set_account_disabled", { target_user_id: target, disable: false }],
  delete: (target) => ["admin_delete_account", { target_user_id: target }],
};

/** One action for every account operation; the hidden `op` field picks the RPC. */
export async function manageAccountAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const targetUserId = value(formData, "targetUserId");
  const op = value(formData, "op") as AccountOperation;
  if (!uuidPattern.test(targetUserId) || !(op in accountRpc)) return unauthorizedState();

  if (op === "password") {
    const passwordError = validatePassword(String(formData.get("password") ?? ""));
    if (passwordError) return { status: "error", message: "Check the password.", fieldErrors: { password: passwordError } };
  }

  const supabase = await adminClient();
  if (!supabase) return unauthorizedState();

  const [name, args] = accountRpc[op](targetUserId, formData);
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { status: "error", message: "Unable to update the account." };
  if (data === "unauthorized") return unauthorizedState();

  const result = accountMessages[String(data)] ?? { status: "error", message: "Unable to update the account." };
  if (result.status === "success") revalidatePath("/admin", "layout");
  return result;
}

const noticeMessages: Record<string, AdminReviewActionState> = {
  posted: { status: "success", message: "Notice posted." },
  removed: { status: "success", message: "Notice removed." },
  invalid_message: { status: "error", message: "Check the notice.", fieldErrors: { message: "Use 1 to 300 characters." } },
  invalid_tone: { status: "error", message: "Choose a notice style." },
  invalid_end: { status: "error", message: "Check the end time.", fieldErrors: { endsAt: "Pick a time in the future." } },
  not_found: { status: "error", message: "This notice was already removed." },
};

async function noticeRpc(name: string, args: Record<string, unknown>): Promise<AdminReviewActionState> {
  const supabase = await adminClient();
  if (!supabase) return unauthorizedState();
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { status: "error", message: "Unable to update notices." };
  if (data === "unauthorized") return unauthorizedState();
  const result = noticeMessages[String(data)] ?? { status: "error", message: "Unable to update notices." };
  // Notices show on every signed-in page and the auth pages.
  if (result.status === "success") revalidatePath("/", "layout");
  return result;
}

export async function postNoticeAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const message = value(formData, "message");
  const endsAtLocal = value(formData, "endsAt");
  // The browser sends its timezone offset with the local time so the server stores the right instant.
  const offset = Number(value(formData, "tzOffset") || 0);
  const endsAt = endsAtLocal ? new Date(new Date(`${endsAtLocal}Z`).getTime() + offset * 60_000) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return { status: "error", message: "Check the end time.", fieldErrors: { endsAt: "Pick a valid date and time." } };
  }
  return noticeRpc("post_site_announcement", {
    message,
    tone: value(formData, "tone"),
    ends_at: endsAt?.toISOString() ?? null,
  });
}

export async function removeNoticeAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const id = value(formData, "noticeId");
  if (!uuidPattern.test(id)) return unauthorizedState();
  return noticeRpc("remove_site_announcement", { target_id: id });
}
