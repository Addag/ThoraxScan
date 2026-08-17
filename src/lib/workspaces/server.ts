import type { StudentWorkspace, Workspace } from "@/lib/workspaces/types";
import { createClient } from "@/lib/supabase/server";

type StudentWorkspaceRow = {
  role: "student";
  joined_at: string;
  workspaces: Workspace;
};

export async function getStudentWorkspaces(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, joined_at, workspaces!inner(id, name, owner_id, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .eq("role", "student")
    .order("joined_at", { ascending: false })
    .returns<StudentWorkspaceRow[]>();

  if (error) {
    return { data: [] as StudentWorkspace[], error: error.message };
  }

  return {
    data: data.map(({ workspaces, joined_at }) => ({
      ...workspaces,
      membership_role: "student" as const,
      joined_at,
    })),
    error: null,
  };
}

export async function getStudentWorkspace(userId: string, workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, joined_at, workspaces!inner(id, name, owner_id, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("role", "student")
    .maybeSingle<StudentWorkspaceRow>();

  if (error || !data) return null;

  return {
    ...data.workspaces,
    membership_role: "student" as const,
    joined_at: data.joined_at,
  } satisfies StudentWorkspace;
}
