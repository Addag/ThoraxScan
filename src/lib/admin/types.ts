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
  rejection_reason: string | null;
  membership_count: number;
};

export type AdminReviewActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: { rejectionReason?: string };
};

export const initialAdminReviewState: AdminReviewActionState = {
  status: "idle",
  message: "",
};
