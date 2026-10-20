import "server-only";

import type { AccountSettings } from "@/lib/settings/types";
import { defaultAccountSettings } from "@/lib/settings/types";
import { createClient } from "@/lib/supabase/server";

type AccountSettingsRow = {
  work_phone: string | null;
};

function projectSettings(row: AccountSettingsRow | null): AccountSettings {
  if (!row) return defaultAccountSettings;
  return {
    workPhone: row.work_phone,
  };
}

export async function getSettingsPageData(profileId: string) {
  const supabase = await createClient();
  const [userResult, settingsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("account_settings")
      .select("work_phone")
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
