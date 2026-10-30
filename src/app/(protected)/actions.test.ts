import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveLearningNoteAction } from "./actions";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getClaims: vi.fn(),
  upsert: vi.fn(),
  deleteEq: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const idle = { status: "idle", message: "" } as const;

function noteForm(caseId: string, body: string) {
  const formData = new FormData();
  formData.set("caseId", caseId);
  formData.set("body", body);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });
  mocks.upsert.mockResolvedValue({ error: null });
  const secondEq = vi.fn().mockResolvedValue({ error: null });
  mocks.deleteEq.mockReturnValue({ eq: secondEq });
  mocks.createClient.mockResolvedValue({
    auth: { getClaims: mocks.getClaims },
    from: () => ({ upsert: mocks.upsert, delete: () => ({ eq: mocks.deleteEq }) }),
  });
});

describe("save learning note", () => {
  it("upserts a trimmed note for a library case", async () => {
    const result = await saveLearningNoteAction(idle, noteForm("cxp-001", "  Right base opacity.  "));

    expect(result).toMatchObject({ status: "success", caseId: "cxp-001", body: "Right base opacity." });
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith(
      { user_id: "user-1", case_id: "cxp-001", body: "Right base opacity." },
      { onConflict: "user_id,case_id" },
    );
  });

  it("deletes the row when the note is cleared", async () => {
    const result = await saveLearningNoteAction(idle, noteForm("cxp-001", "   "));

    expect(result).toMatchObject({ status: "success", body: "" });
    expect(mocks.deleteEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("rejects unknown cases and over-length notes before touching the database", async () => {
    expect((await saveLearningNoteAction(idle, noteForm("upload-1", "Note"))).status).toBe("error");
    expect((await saveLearningNoteAction(idle, noteForm("cxp-001", "a".repeat(2001)))).status).toBe("error");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });

    expect((await saveLearningNoteAction(idle, noteForm("cxp-001", "Note"))).status).toBe("unauthorized");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
