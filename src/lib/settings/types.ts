export type AccountSettings = {
  workPhone: string | null;
};

export type SettingsField = "displayName" | "workPhone";

export type SavedSettingsValues = AccountSettings & {
  displayName: string;
};

export type SettingsActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<SettingsField, string>>;
  savedValues?: SavedSettingsValues;
};

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export type PasswordActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<PasswordField, string>>;
};

export type EmailField = "newEmail" | "currentPassword";

export type EmailActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<EmailField, string>>;
};

export type TwoStepActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  fieldErrors?: Partial<Record<"code" | "currentPassword", string>>;
  enabled: boolean;
  /** Present only between "Turn on" and the confirming code. */
  setup?: { factorId: string; qrCode: string; secret: string };
};

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
  message: "",
};

export const defaultAccountSettings: AccountSettings = {
  workPhone: null,
};
