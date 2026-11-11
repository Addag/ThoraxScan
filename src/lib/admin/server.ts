import type { ProfessorApplication } from "@/lib/auth/types";
import type {
  AccountProjection,
  AdminActionEntry,
  PlatformAdminProjection,
  PlatformEvent,
  PlatformStats,
  ProfessorApplicationProjection,
  ProfessorReportRow,
  SiteAnnouncement,
} from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

// Administrator RPCs re-check the caller and raise for anyone else.
async function adminRpc<T>(name: string, args?: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, args);
  return error ? { data: [] as T[], error: error.message } : { data: (data ?? []) as T[], error: null };
}

export const getProfessorApplications = () => adminRpc<ProfessorApplicationProjection>("list_professor_applications");
export const getPlatformAdmins = () => adminRpc<PlatformAdminProjection>("list_platform_admins");
export const getAccounts = () => adminRpc<AccountProjection>("list_accounts");
export const getPlatformStats = () => adminRpc<PlatformStats>("get_platform_stats");
export const getProfessorReport = () => adminRpc<ProfessorReportRow>("list_professor_report");
export const getPlatformEvents = () => adminRpc<PlatformEvent>("list_platform_events", { max_rows: 30 });
export const getAdminActions = () => adminRpc<AdminActionEntry>("list_admin_actions", { max_rows: 30 });

/** Active notices only; RLS hides expired ones. Readable signed out too. */
export async function getActiveAnnouncements() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_announcements")
    .select("id, message, tone, ends_at")
    .order("created_at", { ascending: false })
    .returns<SiteAnnouncement[]>();
  return data ?? [];
}

export async function getOwnProfessorApplication(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professor_applications")
    .select(
      "user_id, status, requested_at, reviewed_at, reviewed_by, rejection_reason, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle<ProfessorApplication>();

  if (error || !data) return null;
  return data;
}
