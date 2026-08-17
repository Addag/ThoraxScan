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
