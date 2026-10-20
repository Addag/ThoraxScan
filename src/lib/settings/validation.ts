import type { AppRole } from "@/lib/auth/types";
import type { SavedSettingsValues, SettingsActionState } from "@/lib/settings/types";

const phonePattern = /^[0-9+() .-]+$/;

export function normalizeDisplayName(value: string) {
  return value.trim();
}

export function normalizeWorkPhone(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function validateDisplayName(value: string) {
  const normalized = normalizeDisplayName(value);
  if (normalized.length < 1 || normalized.length > 100) {
    return "Use between 1 and 100 characters.";
  }
  return null;
}

export function validateWorkPhone(value: string) {
  const normalized = normalizeWorkPhone(value);
  if (!normalized) return null;
  if (normalized.length < 7 || normalized.length > 32 || !phonePattern.test(normalized)) {
    return "Use 7 to 32 digits or phone symbols (+, parentheses, spaces, dots, or hyphens).";
  }
  return null;
}

export function validateSettingsInput({
  displayName,
  workPhone,
  role,
}: {
  displayName: string;
  workPhone: string;
  role: AppRole;
}):
  | { valid: true; values: SavedSettingsValues }
  | { valid: false; state: SettingsActionState } {
  const displayNameError = validateDisplayName(displayName);
  const workPhoneError = validateWorkPhone(workPhone);
  const normalizedWorkPhone = normalizeWorkPhone(workPhone);
  const fieldErrors: SettingsActionState["fieldErrors"] = {};

  if (displayNameError) fieldErrors.displayName = displayNameError;
  if (workPhoneError) fieldErrors.workPhone = workPhoneError;
  if (role === "student" && normalizedWorkPhone) {
    fieldErrors.workPhone = "Work phone is available only to Professor accounts.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      state: {
        status: "error",
        message: "Check the highlighted settings.",
        fieldErrors,
      },
    };
  }

  return {
    valid: true,
    values: {
      displayName: normalizeDisplayName(displayName),
      workPhone: normalizedWorkPhone,
    },
  };
}
