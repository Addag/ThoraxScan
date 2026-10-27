import { beforeEach, describe, expect, it, vi } from "vitest";

import { changeEmailAction } from "./actions";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getClaims: vi.fn(),
  rpc: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const idle = { status: "idle", message: "" } as const;

function emailForm(newEmail = " New@Example.com ", currentPassword = "current-password") {
  const formData = new FormData();
  formData.set("newEmail", newEmail);
  formData.set("currentPassword", currentPassword);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1", email: "old@example.com" } }, error: null });
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.createClient.mockResolvedValue({
    auth: { getClaims: mocks.getClaims, updateUser: mocks.updateUser },
    rpc: mocks.rpc,
  });
});

describe("change email", () => {
  it("rejects a wrong current password without requesting the change", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    const result = await changeEmailAction(idle, emailForm());

    expect(result.fieldErrors?.currentPassword).toBe("Current password is incorrect.");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects the current email", async () => {
    const result = await changeEmailAction(idle, emailForm("OLD@example.com"));

    expect(result.fieldErrors?.newEmail).toBe("This is already your sign-in email.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("requests the change with a normalized email and the confirm route", async () => {
    const result = await changeEmailAction(idle, emailForm());

    expect(result.status).toBe("success");
    expect(mocks.updateUser).toHaveBeenCalledExactlyOnceWith(
      { email: "new@example.com" },
      { emailRedirectTo: expect.stringMatching(/\/auth\/confirm\?next=\/dashboard$/) },
    );
  });

  it("reports an email already in use on the field", async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: "email_exists" } });

    const result = await changeEmailAction(idle, emailForm());

    expect(result.fieldErrors?.newEmail).toBe("That email is already in use.");
  });
});
