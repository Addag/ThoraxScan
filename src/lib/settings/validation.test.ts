import { describe, expect, it } from "vitest";

import {
  normalizeDisplayName,
  normalizeWorkPhone,
  validateDisplayName,
  validateSettingsInput,
  validateWorkPhone,
} from "@/lib/settings/validation";

describe("settings validation", () => {
  it("normalizes display names and blank phone values", () => {
    expect(normalizeDisplayName("  Ada Student  ")).toBe("Ada Student");
    expect(normalizeWorkPhone("   ")).toBeNull();
    expect(normalizeWorkPhone(" +63 917 555 0101 ")).toBe("+63 917 555 0101");
  });

  it("enforces the existing display-name length contract", () => {
    expect(validateDisplayName("   ")).toBe("Use between 1 and 100 characters.");
    expect(validateDisplayName("a".repeat(101))).toBe(
      "Use between 1 and 100 characters.",
    );
    expect(validateDisplayName("Ada Student")).toBeNull();
  });

  it("accepts phone-like values and rejects unsupported characters", () => {
    expect(validateWorkPhone("+63 (917) 555-0101")).toBeNull();
    expect(validateWorkPhone("123")).toMatch(/7 to 32/);
    expect(validateWorkPhone("0917 CALL-NOW")).toMatch(/7 to 32/);
  });

  it("rejects a work phone for Student accounts", () => {
    const result = validateSettingsInput({
      displayName: "Ada Student",
      workPhone: "+63 917 555 0101",
      darkImageBackground: true,
      role: "student",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.state.fieldErrors?.workPhone).toMatch(/Professor/);
    }
  });

  it("returns normalized Professor settings", () => {
    expect(
      validateSettingsInput({
        displayName: "  Grace Professor  ",
        workPhone: " +63 2 8123 4567 ",
        darkImageBackground: false,
        role: "professor",
      }),
    ).toEqual({
      valid: true,
      values: {
        displayName: "Grace Professor",
        workPhone: "+63 2 8123 4567",
        darkImageBackground: false,
      },
    });
  });
});
