import { redirect } from "next/navigation";

import type {
  AppRole,
  ProfessorApplicationStatus,
  Profile,
  ProfileWithAccess,
} from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { authenticated: false as const, profile: null, error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .single<Profile>();

  // Raised by the database when this account uses two-step login and the session has not passed it.
  if (error?.message === "two_step_required") redirect("/login/verify");

  if (error || !data) {
    return {
      authenticated: true as const,
      profile: null,
      error: "Your account profile is unavailable. Contact an administrator.",
    };
  }

  let professorApplicationStatus: ProfessorApplicationStatus | null = null;

  if (data.role === "professor") {
    const { data: application, error: applicationError } = await supabase
      .from("professor_applications")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle<{ status: ProfessorApplicationStatus }>();

    if (applicationError || !application) {
      return {
        authenticated: true as const,
        profile: null,
        error: "Your Professor application is unavailable. Contact an administrator.",
      };
    }

    professorApplicationStatus = application.status;
  }

  return {
    authenticated: true as const,
    profile: {
      ...data,
      professor_application_status: professorApplicationStatus,
    } satisfies ProfileWithAccess,
    error: null,
  };
}

export async function requireRole(role: AppRole) {
  const result = await getCurrentProfile();

  if (!result.authenticated) {
    redirect("/login");
  }

  if (!result.profile || result.profile.role !== role) {
    redirect("/dashboard");
  }

  if (
    role === "professor" &&
    result.profile.professor_application_status !== "approved"
  ) {
    redirect("/professor/application");
  }

  return result.profile;
}

export async function requirePlatformAdmin() {
  const result = await getCurrentProfile();

  if (!result.authenticated) redirect("/login");
  if (!result.profile) redirect("/dashboard");
  if (!(await isPlatformAdmin(result.profile.id))) redirect("/dashboard");
  return result.profile;
}

/** Whether this user (default: the signed-in one) is a platform administrator. */
export async function isPlatformAdmin(userId?: string) {
  const supabase = await createClient();
  const id = userId ?? (await supabase.auth.getClaims()).data?.claims?.sub;
  if (!id) return false;

  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", id)
    .maybeSingle<{ user_id: string }>();

  return !error && !!data;
}
