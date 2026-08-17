"use server";

import { redirect } from "next/navigation";

import type { AppRole, AuthActionState, AuthField } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function errorState(
  message: string,
  fieldErrors?: Partial<Record<AuthField, string>>,
): AuthActionState {
  return { status: "error", message, fieldErrors };
}

function validateEmail(email: string) {
  if (!email) return "Enter your email address.";
  if (!emailPattern.test(email)) return "Enter a valid email address.";
}

function validatePassword(password: string) {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Use at least 8 characters.";
}

function isAppRole(role: string): role is AppRole {
  return role === "student" || role === "professor";
}

function authMessage(code: string | undefined, fallback: string) {
  if (code === "invalid_credentials") return "Email or password is incorrect.";
  if (code === "email_not_confirmed") {
    return "Confirm your email address before logging in.";
  }
  if (code === "over_email_send_rate_limit") {
    return "Too many emails were requested. Please try again later.";
  }
  return fallback;
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = value(formData, "displayName").trim();
  const email = value(formData, "email").trim().toLowerCase();
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  const fieldErrors: Partial<Record<AuthField, string>> = {};

  if (!displayName) fieldErrors.displayName = "Enter your display name.";
  else if (displayName.length > 100) {
    fieldErrors.displayName = "Use 100 characters or fewer.";
  }
  fieldErrors.email = validateEmail(email);
  fieldErrors.password = validatePassword(password);
  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords must match.";
  }

  Object.keys(fieldErrors).forEach((key) => {
    if (!fieldErrors[key as AuthField]) delete fieldErrors[key as AuthField];
  });

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Check the highlighted fields.", fieldErrors);
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    return errorState(
      authMessage(error.code, "Unable to create your account. Please try again."),
    );
  }

  return {
    status: "success",
    message:
      "Check your email and follow the confirmation link before logging in.",
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = value(formData, "email").trim().toLowerCase();
  const password = value(formData, "password");
  const expectedRole = value(formData, "expectedRole");
  const fieldErrors: Partial<Record<AuthField, string>> = {};

  fieldErrors.email = validateEmail(email);
  if (!password) fieldErrors.password = "Enter your password.";
  if (!isAppRole(expectedRole)) {
    fieldErrors.expectedRole = "Choose Student or Professor.";
  }

  Object.keys(fieldErrors).forEach((key) => {
    if (!fieldErrors[key as AuthField]) delete fieldErrors[key as AuthField];
  });

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Check the highlighted fields.", fieldErrors);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return errorState(
      authMessage(error.code, "Unable to log in. Please try again."),
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: AppRole }>();

  if (profileError || !profile || !isAppRole(profile.role)) {
    await supabase.auth.signOut({ scope: "local" });
    return errorState(
      "We could not verify your account profile. Please contact an administrator.",
    );
  }

  if (profile.role !== expectedRole) {
    await supabase.auth.signOut({ scope: "local" });
    return errorState(
      `This account is registered as ${profile.role}. Select ${profile.role === "student" ? "Student" : "Professor"} and try again.`,
      { expectedRole: "The selected account type does not match this account." },
    );
  }

  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = value(formData, "email").trim().toLowerCase();
  const emailError = validateEmail(email);

  if (emailError) {
    return errorState("Check the highlighted field.", { email: emailError });
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  if (error?.code === "over_email_send_rate_limit") {
    return errorState(authMessage(error.code, ""));
  }

  if (error) {
    return errorState("Unable to send a reset email. Please try again.");
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  const fieldErrors: Partial<Record<AuthField, string>> = {};

  fieldErrors.password = validatePassword(password);
  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords must match.";
  }

  Object.keys(fieldErrors).forEach((key) => {
    if (!fieldErrors[key as AuthField]) delete fieldErrors[key as AuthField];
  });

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Check the highlighted fields.", fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return errorState("Unable to update your password. Request a new reset link.");
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?message=Password%20updated.%20Log%20in%20with%20your%20new%20password.");
}
