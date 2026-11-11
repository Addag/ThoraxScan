export type AppRole = "student" | "professor";
export type LoginPortal = AppRole | "administrator";
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ProfessorApplicationStatus = "pending" | "approved" | "rejected";

export type AuthField =
  | "displayName"
  | "email"
  | "password"
  | "confirmPassword"
  | "captchaToken"
  | "expectedRole"
  | "requestedRole"
  | "termsAccepted"
  | "privacyNoticeAccepted";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
};

export const initialAuthState: AuthActionState = {
  status: "idle",
  message: "",
};

export type Profile = {
  id: string;
  display_name: string;
  role: AppRole;
};

export type ProfileWithAccess = Profile & {
  professor_application_status: ProfessorApplicationStatus | null;
};

export type ProfessorApplication = {
  user_id: string;
  status: ProfessorApplicationStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

/** Shared by registration, password reset, and administrator temporary passwords. */
export function validatePassword(password: string) {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
}
