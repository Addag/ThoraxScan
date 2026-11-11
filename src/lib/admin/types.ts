import type { ProfessorApplicationStatus } from "@/lib/auth/types";

export type ProfessorApplicationProjection = {
  user_id: string;
  display_name: string;
  email: string;
  email_confirmed: boolean;
  status: ProfessorApplicationStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_name: string | null;
  rejection_reason: string | null;
  membership_count: number;
};

export type AdminReviewActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: { rejectionReason?: string; email?: string; displayName?: string; password?: string; message?: string; endsAt?: string };
};

export type PlatformAdminProjection = {
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  created_by_name: string | null;
};

export const initialAdminReviewState: AdminReviewActionState = {
  status: "idle",
  message: "",
};

export type AccountProjection = {
  user_id: string;
  display_name: string;
  email: string;
  role: "student" | "professor";
  professor_status: ProfessorApplicationStatus | null;
  created_at: string;
  last_sign_in_at: string | null;
  disabled: boolean;
  is_admin: boolean;
};

export type AccountOperation = "rename" | "password" | "signout" | "disable" | "enable" | "delete";

export type PlatformStats = {
  students: number;
  professors_approved: number;
  professors_pending: number;
  administrators: number;
  workspaces: number;
  activities_published: number;
  activities_draft: number;
  final_submissions: number;
  feedback_released: number;
  new_accounts_30d: number;
};

export type ProfessorReportRow = {
  user_id: string;
  display_name: string;
  email: string;
  workspaces: number;
  students: number;
  activities: number;
  final_submissions: number;
  feedback_released: number;
};

export type PlatformEvent = { at: string; kind: string; summary: string };

export type AdminActionEntry = {
  created_at: string;
  actor_name: string;
  action: string;
  target_label: string;
  detail: string;
};

export type SiteAnnouncement = { id: string; message: string; tone: "info" | "warning"; ends_at: string | null };
