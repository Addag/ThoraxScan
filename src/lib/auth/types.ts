export type AppRole = "student" | "professor";

export type AuthField =
  | "displayName"
  | "email"
  | "password"
  | "confirmPassword";

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
