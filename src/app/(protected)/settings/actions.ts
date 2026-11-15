"use server";

import { revalidatePath } from "next/cache";

import { type AppRole, emailPattern } from "@/lib/auth/types";
import type {
  EmailActionState,
  EmailField,
  PasswordActionState,
  PasswordField,
  SettingsActionState,
  TwoStepActionState,
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
  else if (!/[a-z]/i.test(newPassword) || !/\d/.test(newPassword)) {
    fieldErrors.newPassword = "Include at least one letter and one number.";
  }
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

export async function changeEmailAction(
  _previousState: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  const newEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const fieldErrors: Partial<Record<EmailField, string>> = {};

  if (!newEmail) fieldErrors.newEmail = "Enter a new email address.";
  else if (!emailPattern.test(newEmail)) fieldErrors.newEmail = "Enter a valid email address.";
  if (!currentPassword) fieldErrors.currentPassword = "Enter your current password.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "unauthorized",
      message: "Your session has expired. Log in again before changing your email.",
    };
  }
  if (newEmail === claimsData.claims.email?.toLowerCase()) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { newEmail: "This is already your sign-in email." },
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard` },
  );

  if (error) {
    if (error.code === "email_exists") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { newEmail: "That email is already in use." },
      };
    }
    if (error.code === "email_address_invalid") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { newEmail: "This email address can't be used. Try another one." },
      };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { status: "error", message: "Too many emails were requested. Please try again later." };
    }
    return { status: "error", message: "Unable to change your email. Try again." };
  }

  revalidatePath("/student/settings");
  revalidatePath("/professor/settings");
  return {
    status: "success",
    message: `Confirmation links were sent to your current email and ${newEmail}. Click both to finish the change.`,
  };
}

/** One action for the Two-step login panel; the submit button's `op` picks the step. */
export async function twoStepAction(
  previousState: TwoStepActionState,
  formData: FormData,
): Promise<TwoStepActionState> {
  const op = String(formData.get("op") ?? "");
  const supabase = await createClient();
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

  if (factorsError) {
    return {
      enabled: previousState.enabled,
      status: "unauthorized",
      message: "Your session has expired. Log in again before changing two-step login.",
    };
  }

  // `totp` holds verified factors only.
  const enabled = factors.totp.length > 0;
  const idle: TwoStepActionState = { enabled, status: "idle", message: "" };

  if (op === "start" && !enabled) {
    // Supabase keeps factors from abandoned setups; remove them before starting again.
    await Promise.all(
      factors.all
        .filter((factor) => factor.status === "unverified")
        .map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
    );
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "ThoraxScan" });
    if (error) return { ...idle, status: "error", message: "Unable to start the setup. Try again." };
    return { ...idle, setup: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
  }

  if (op === "cancel" && previousState.setup) {
    // The factor id comes back from the browser, so only remove a setup that was never confirmed.
    // Removing a confirmed factor must go through "disable", which asks for the password.
    const setupId = previousState.setup.factorId;
    const pending = factors.all.find((factor) => factor.id === setupId && factor.status === "unverified");
    if (pending) await supabase.auth.mfa.unenroll({ factorId: pending.id });
    return idle;
  }

  if (op === "confirm" && previousState.setup) {
    const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    const { error } = /^\d{6}$/.test(code)
      ? await supabase.auth.mfa.challengeAndVerify({ factorId: previousState.setup.factorId, code })
      : { error: true };

    if (error) {
      return {
        ...idle,
        setup: previousState.setup,
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { code: "That code is incorrect or expired. Enter the newest 6-digit code." },
      };
    }

    // Keep this device signed in; end every other session so none stays password-only.
    await supabase.auth.signOut({ scope: "others" });
    return {
      enabled: true,
      status: "success",
      message: "Two-step login is on. You'll enter a code from your app each time you log in.",
    };
  }

  if (op === "disable" && enabled) {
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const { data: verified, error: verifyError } = currentPassword
      ? await supabase.rpc("verify_own_password", { current_password: currentPassword })
      : { data: false, error: null };

    if (verifyError) return { ...idle, status: "error", message: "Unable to verify your password. Try again." };
    if (!verified) {
      return {
        ...idle,
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { currentPassword: currentPassword ? "Current password is incorrect." : "Enter your current password." },
      };
    }

    const results = await Promise.all(
      factors.totp.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
    );
    if (results.some((result) => result.error)) {
      return { ...idle, status: "error", message: "Unable to turn off two-step login. Log in again and retry." };
    }
    return { enabled: false, status: "success", message: "Two-step login is off." };
  }

  return idle;
}
