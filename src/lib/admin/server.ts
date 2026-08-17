import type { ProfessorApplication } from "@/lib/auth/types";
import type { ProfessorApplicationProjection } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

export async function getProfessorApplications() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_professor_applications");

  if (error) {
    return { data: [] as ProfessorApplicationProjection[], error: error.message };
  }

  return {
    data: (data ?? []) as ProfessorApplicationProjection[],
    error: null,
  };
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
