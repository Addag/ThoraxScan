import "server-only";

import type { AccountSettings } from "@/lib/settings/types";
import { defaultAccountSettings } from "@/lib/settings/types";
import { createClient } from "@/lib/supabase/server";

type AccountSettingsRow = {
  work_phone: string | null;
  dark_image_background: boolean;
};

function projectSettings(row: AccountSettingsRow | null): AccountSettings {
  if (!row) return defaultAccountSettings;
  return {
    workPhone: row.work_phone,
    darkImageBackground: row.dark_image_background,
  };
}

export async function getOwnAccountSettings(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_settings")
    .select("work_phone, dark_image_background")
    .eq("profile_id", profileId)
    .maybeSingle<AccountSettingsRow>();

  return {
    settings: projectSettings(data),
    error: error ? "Your saved display settings are temporarily unavailable." : null,
  };
}

export async function getSettingsPageData(profileId: string) {
  const supabase = await createClient();
  const [userResult, settingsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("account_settings")
      .select("work_phone, dark_image_background")
      .eq("profile_id", profileId)
      .maybeSingle<AccountSettingsRow>(),
  ]);

  return {
    email: userResult.data.user?.email ?? "",
    settings: projectSettings(settingsResult.data),
    error:
      userResult.error || settingsResult.error
        ? "Some account settings could not be loaded. Reload before saving changes."
        : null,
  };
}
