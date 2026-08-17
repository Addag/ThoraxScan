import type { AppRole } from "@/lib/auth/types";

export type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role: AppRole;
  joined_at: string;
};

export type InvitationCode = {
  id: string;
  workspace_id: string;
  created_by: string;
  invited_role: AppRole;
  expires_at: string;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudentWorkspace = Workspace & {
  membership_role: "student";
  joined_at: string;
};

export type ProfessorWorkspace = Workspace & {
  membership_role: "professor";
  joined_at: string;
  is_owner: boolean;
};

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  display_name: string;
  is_owner: boolean;
};

export type ProfessorWorkspaceDetails = Workspace & {
  joined_at: string;
  is_owner: boolean;
  members: WorkspaceMemberWithProfile[];
  invitations: InvitationCode[];
};

export type WorkspaceActionField =
  | "name"
  | "code"
  | "expiresInDays"
  | "maxUses";

export type WorkspaceActionState = {
  status:
    | "idle"
    | "error"
    | "success"
    | "expired"
    | "revoked"
    | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<WorkspaceActionField, string>>;
  invitationCode?: string;
};

export const initialWorkspaceActionState: WorkspaceActionState = {
  status: "idle",
  message: "",
};

export type InvitationFormState = {
  status:
    | "idle"
    | "error"
    | "success"
    | "expired"
    | "revoked"
    | "unauthorized";
  message: string;
  fieldErrors?: { code?: string };
};

export const initialInvitationState: InvitationFormState = {
  status: "idle",
  message: "",
};
