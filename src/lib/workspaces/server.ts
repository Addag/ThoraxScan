import type {
  InvitationCode,
  ProfessorWorkspace,
  ProfessorWorkspaceDetails,
  StudentWorkspace,
  Workspace,
  WorkspaceMember,
} from "@/lib/workspaces/types";
import { createClient } from "@/lib/supabase/server";

type StudentWorkspaceRow = {
  role: "student";
  joined_at: string;
  workspaces: Workspace;
};

type ProfessorWorkspaceRow = {
  role: "professor";
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

export async function getProfessorWorkspaces(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, joined_at, workspaces!inner(id, name, owner_id, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .eq("role", "professor")
    .order("joined_at", { ascending: false })
    .returns<ProfessorWorkspaceRow[]>();

  if (error) {
    return { data: [] as ProfessorWorkspace[], error: error.message };
  }

  return {
    data: data.map(({ workspaces, joined_at }) => ({
      ...workspaces,
      membership_role: "professor" as const,
      joined_at,
      is_owner: workspaces.owner_id === userId,
    })),
    error: null,
  };
}

export async function getProfessorWorkspace(
  userId: string,
  workspaceId: string,
) {
  const supabase = await createClient();
  const [workspaceResult, membershipResult, membersResult, invitationsResult] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("id, name, owner_id, created_at, updated_at")
        .eq("id", workspaceId)
        .maybeSingle<Workspace>(),
      supabase
        .from("workspace_members")
        .select("workspace_id, user_id, role, joined_at")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .eq("role", "professor")
        .maybeSingle<WorkspaceMember>(),
      supabase
        .from("workspace_members")
        .select("workspace_id, user_id, role, joined_at")
        .eq("workspace_id", workspaceId)
        .order("joined_at", { ascending: true })
        .returns<WorkspaceMember[]>(),
      supabase
        .from("invitation_codes")
        .select(
          "id, workspace_id, created_by, invited_role, expires_at, max_uses, uses_count, is_active, created_at, updated_at",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .returns<InvitationCode[]>(),
    ]);

  const workspace = workspaceResult.data;
  const membership = membershipResult.data;
  if (
    workspaceResult.error ||
    membershipResult.error ||
    membersResult.error ||
    invitationsResult.error ||
    !workspace ||
    !membership
  ) {
    return null;
  }

  const userIds = membersResult.data.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds)
        .returns<Array<{ id: string; display_name: string }>>()
    : { data: [], error: null };

  if (profilesError) return null;

  const displayNames = new Map(
    profiles.map((profile) => [profile.id, profile.display_name]),
  );

  return {
    ...workspace,
    joined_at: membership.joined_at,
    is_owner: workspace.owner_id === userId,
    members: membersResult.data.map((member) => ({
      ...member,
      display_name: displayNames.get(member.user_id) ?? "Unavailable profile",
      is_owner: member.user_id === workspace.owner_id,
    })),
    invitations: invitationsResult.data,
  } satisfies ProfessorWorkspaceDetails;
}
