import { redirect } from "next/navigation";

import type { AppRole, Profile } from "@/lib/auth/types";
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

  if (error || !data) {
    return {
      authenticated: true as const,
      profile: null,
      error: "Your account profile is unavailable. Contact an administrator.",
    };
  }

  return { authenticated: true as const, profile: data, error: null };
}

export async function requireRole(role: AppRole) {
  const result = await getCurrentProfile();

  if (!result.authenticated) {
    redirect("/login");
  }

  if (!result.profile || result.profile.role !== role) {
    redirect("/dashboard");
  }

  return result.profile;
}
