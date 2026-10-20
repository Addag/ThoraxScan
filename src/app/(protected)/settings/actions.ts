"use server";

import { revalidatePath } from "next/cache";

import type { AppRole } from "@/lib/auth/types";
import type {
  PasswordActionState,
  PasswordField,
  SettingsActionState,
} from "@/lib/settings/types";
import { validateSettingsInput } from "@/lib/settings/validation";
import { createClient } from "@/lib/supabase/server";

export async function updateAccountSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      status: "unauthorized",
      message: "Your session has expired. Log in again before saving settings.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: AppRole }>();

  if (profileError || !profile) {
    return {
      status: "unauthorized",
      message: "Your account profile is unavailable.",
    };
  }

  const validation = validateSettingsInput({
    displayName: String(formData.get("displayName") ?? ""),
    workPhone: String(formData.get("workPhone") ?? ""),
    role: profile.role,
  });

  if (!validation.valid) return validation.state;

  const { error } = await supabase.rpc("update_own_account_settings", {
    new_display_name: validation.values.displayName,
    new_work_phone: validation.values.workPhone,
  });

  if (error) {
    return {
      status: "error",
      message: "Unable to save account settings. Reload and try again.",
    };
  }

  revalidatePath(`/${profile.role}`);
  revalidatePath(`/${profile.role}/settings`);
  return {
    status: "success",
    message: "Settings saved.",
    savedValues: validation.values,
  };
}

export async function changePasswordAction(
  _previousState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fieldErrors: Partial<Record<PasswordField, string>> = {};

  if (!currentPassword) fieldErrors.currentPassword = "Enter your current password.";
  if (!newPassword) fieldErrors.newPassword = "Enter a new password.";
  else if (newPassword.length < 8) fieldErrors.newPassword = "Use at least 8 characters.";
  else if (newPassword === currentPassword) {
    fieldErrors.newPassword = "Choose a password different from your current one.";
  }
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirm your new password.";
  else if (newPassword !== confirmPassword) fieldErrors.confirmPassword = "Passwords must match.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "unauthorized",
      message: "Your session has expired. Log in again before changing your password.",
    };
  }

  const { data: verified, error: verifyError } = await supabase.rpc(
    "verify_own_password",
    { current_password: currentPassword },
  );

  if (verifyError) {
    return { status: "error", message: "Unable to verify your password. Try again." };
  }
  if (!verified) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { currentPassword: "Current password is incorrect." },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    if (error.code === "same_password") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { newPassword: "Choose a password different from your current one." },
      };
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { newPassword: "This password is too weak. Choose a stronger one." },
      };
    }
    return { status: "error", message: "Unable to update your password. Try again." };
  }

  // Keep this device signed in; end every other session.
  await supabase.auth.signOut({ scope: "others" });
  return { status: "success", message: "Password updated." };
}
