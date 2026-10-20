"use server";

import { revalidatePath } from "next/cache";

import type { AppRole } from "@/lib/auth/types";
import type { SettingsActionState } from "@/lib/settings/types";
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
