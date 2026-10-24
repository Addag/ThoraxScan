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
  fieldErrors?: { rejectionReason?: string; email?: string };
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
