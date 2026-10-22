import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialAuthState } from "@/lib/auth/types";
import { registerAction } from "./actions";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), signUp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function registrationForm() {
  const formData = new FormData();
  for (const [field, value] of Object.entries({
    displayName: "Terms test",
    email: "terms-test@example.com",
    password: "test-password-123",
    confirmPassword: "test-password-123",
    captchaToken: "test-captcha-token",
    requestedRole: "student",
    privacyNoticeAccepted: "yes",
    termsAccepted: "yes",
  })) {
    formData.set(field, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signUp.mockResolvedValue({ error: null });
  mocks.createClient.mockResolvedValue({ auth: { signUp: mocks.signUp } });
});

describe("registration terms agreement", () => {
  it.each([null, "", "on", "no"])("rejects terms acceptance %s before contacting Supabase", async (acceptance) => {
    const formData = registrationForm();
    if (acceptance === null) formData.delete("termsAccepted");
    else formData.set("termsAccepted", acceptance);

    const result = await registerAction(initialAuthState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.termsAccepted).toBe("Accept the Terms and Conditions to create an account.");
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it.each(["student", "professor"])("includes terms and privacy versions in %s signup metadata without age or research answers", async (role) => {
    const formData = registrationForm();
    formData.set("requestedRole", role);

    const result = await registerAction(initialAuthState, formData);

    expect(result.status).toBe("success");
    expect(mocks.signUp).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      options: expect.objectContaining({
        data: expect.objectContaining({
          requested_role: role,
          terms_version: "1.1",
          terms_effective_date: "2026-10-22",
          privacy_policy_version: "1.1",
          privacy_policy_effective_date: "2026-10-22",
        }),
      }),
    }));
    const { data } = mocks.signUp.mock.calls[0][0].options;
    expect(data).not.toHaveProperty("age_band");
    expect(data).not.toHaveProperty("research_consent");
  });

  it("still requires privacy acknowledgement when terms are accepted", async () => {
    const formData = registrationForm();
    formData.delete("privacyNoticeAccepted");

    const result = await registerAction(initialAuthState, formData);

    expect(result.fieldErrors?.privacyNoticeAccepted).toBe("Read and accept the Privacy Policy to create an account.");
    expect(result.fieldErrors?.termsAccepted).toBeUndefined();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
