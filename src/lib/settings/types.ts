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

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
  message: "",
};

export const defaultAccountSettings: AccountSettings = {
  workPhone: null,
};
