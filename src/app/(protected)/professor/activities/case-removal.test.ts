import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialCaseRemovalFormState } from "@/lib/activities/types";
import { removeActivityCaseAction } from "./actions";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const activityId = "11111111-1111-4111-8111-111111111111";
const caseId = "22222222-2222-4222-8222-222222222222";
const workspaceId = "33333333-3333-4333-8333-333333333333";
const replacementId = "44444444-4444-4444-8444-444444444444";

function fixture() {
  const state = {
    authenticated: true,
    role: "professor",
    approved: true,
    member: true,
    activity: { id: activityId, workspace_id: workspaceId, case_id: caseId as string | null, status: "draft", due_at: null },
    xrayCase: { id: caseId, workspace_id: workspaceId, storage_path: `${workspaceId}/${caseId}`, mime_type: "image/jpeg", byte_size: 100, upload_status: "ready" } as Record<string, unknown> | null,
    caseReadError: false,
    linkReadError: false,
    linkedElsewhere: false,
    storageError: false,
    deleteError: false,
    beforeDetach: () => {},
    mutations: [] as string[],
  };
  const remove = vi.fn(async () => {
    state.mutations.push("storage.remove");
    return { data: [], error: state.storageError ? new Error("storage unavailable") : null };
  });
  const from = vi.fn((table: string) => {
    let operation = "read";
    const filters: Record<string, unknown> = {};
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((field: string, value: unknown) => { filters[field] = value; return query; }),
      update: vi.fn(() => { operation = "update"; return query; }),
      delete: vi.fn(() => { operation = "delete"; return query; }),
      maybeSingle: vi.fn(async () => {
        if (table === "profiles") return { data: { role: state.role }, error: null };
        if (table === "professor_applications") return { data: { status: state.approved ? "approved" : "pending" }, error: null };
        if (table === "workspace_members") return { data: state.member ? { workspace_id: workspaceId } : null, error: null };
        if (table === "activities") {
          if (operation === "update") {
            state.beforeDetach();
            if (Object.entries(filters).some(([field, value]) => state.activity[field as keyof typeof state.activity] !== value)) return { data: null, error: null };
            state.activity.case_id = null;
            state.mutations.push("activity.detach");
            return { data: { id: activityId }, error: null };
          }
          if (filters.case_id) return { data: state.linkedElsewhere || state.activity.case_id === filters.case_id ? { id: activityId } : null, error: state.linkReadError ? new Error("read failed") : null };
          return { data: state.activity, error: null };
        }
        if (table === "xray_cases") {
          if (operation === "delete") {
            if (state.deleteError) return { data: null, error: new Error("delete failed") };
            state.mutations.push("case.delete");
            state.xrayCase = null;
            return { data: { id: caseId }, error: null };
          }
          return { data: state.xrayCase, error: state.caseReadError ? new Error("read failed") : null };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    return query;
  });
  mocks.createClient.mockResolvedValue({
    from,
    auth: { getClaims: vi.fn(async () => ({ data: { claims: { sub: state.authenticated ? "professor-id" : null } }, error: null })) },
    storage: { from: vi.fn(() => ({ remove })) },
  });
  const formData = new FormData();
  formData.set("activityId", activityId);
  formData.set("caseId", caseId);
  return { state, formData, remove };
}

beforeEach(() => vi.clearAllMocks());

describe("removeActivityCaseAction", () => {
  it("detaches the expected draft case before deleting storage and its record", async () => {
    const { state, formData, remove } = fixture();
    const result = await removeActivityCaseAction(initialCaseRemovalFormState, formData);
    expect(result.status).toBe("success");
    expect(result.removedCaseId).toBe(caseId);
    expect(state.mutations).toEqual(["activity.detach", "storage.remove", "case.delete"]);
    expect(remove).toHaveBeenCalledWith([`${workspaceId}/${caseId}`]);
    expect(state.activity.case_id).toBeNull();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/professor/activities/${activityId}`);
  });

  it("rejects malformed identifiers without accessing the database", async () => {
    const { formData } = fixture();
    formData.set("caseId", "invalid");
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("unauthorized");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each(["authenticated", "approved", "member"] as const)("rejects removal without %s", async (field) => {
    const { state, formData } = fixture();
    state[field] = false;
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("unauthorized");
    expect(state.mutations).toEqual([]);
  });

  it("rejects student sessions", async () => {
    const { state, formData } = fixture();
    state.role = "student";
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("unauthorized");
    expect(state.mutations).toEqual([]);
  });

  it.each(["published", "archived"])("rejects %s activities", async (status) => {
    const { state, formData } = fixture();
    state.activity.status = status;
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("unauthorized");
    expect(state.mutations).toEqual([]);
  });

  it("rejects a case from a different workspace", async () => {
    const { state, formData } = fixture();
    state.xrayCase!.workspace_id = replacementId;
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("unauthorized");
    expect(state.mutations).toEqual([]);
  });

  it("rejects stale case IDs", async () => {
    const { state, formData } = fixture();
    state.activity.case_id = replacementId;
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("error");
    expect(state.mutations).toEqual([]);
  });

  it.each(["replacement", "publication"])("does not delete when concurrent %s wins the conditional detach", async (race) => {
    const { state, formData } = fixture();
    state.beforeDetach = () => {
      if (race === "replacement") state.activity.case_id = replacementId;
      else state.activity.status = "published";
    };
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("error");
    expect(state.mutations).toEqual([]);
  });

  it.each(["pending", "failed"])("can remove %s upload reservations", async (uploadStatus) => {
    const { state, formData } = fixture();
    state.xrayCase!.upload_status = uploadStatus;
    expect((await removeActivityCaseAction(initialCaseRemovalFormState, formData)).status).toBe("success");
  });

  it.each(["storageError", "deleteError", "linkReadError"] as const)("reports partial removal and safely retries after %s", async (field) => {
    const { state, formData } = fixture();
    state[field] = true;
    const first = await removeActivityCaseAction(initialCaseRemovalFormState, formData);
    expect(first.status).toBe("cleanup_pending");
    expect(first.cleanupCaseId).toBe(caseId);
    expect(state.activity.case_id).toBeNull();
    state[field] = false;
    state.activity.case_id = replacementId;
    const retry = await removeActivityCaseAction(first, formData);
    expect(retry.status).toBe("success");
    expect(retry.cleanupCaseId).toBeUndefined();
    expect(state.activity.case_id).toBe(replacementId);
    expect(state.mutations.filter((mutation) => mutation === "activity.detach")).toHaveLength(1);
  });

  it("does not clean up a case that became attached to another activity", async () => {
    const { state, formData, remove } = fixture();
    state.activity.case_id = null;
    state.linkedElsewhere = true;
    const result = await removeActivityCaseAction({ status: "cleanup_pending", message: "", cleanupCaseId: caseId }, formData);
    expect(result.status).toBe("error");
    expect(remove).not.toHaveBeenCalled();
  });

  it("treats a retry for an already deleted case as success", async () => {
    const { state, formData } = fixture();
    state.activity.case_id = null;
    state.xrayCase = null;
    expect((await removeActivityCaseAction({ status: "cleanup_pending", message: "", cleanupCaseId: caseId }, formData)).status).toBe("success");
    expect(state.mutations).toEqual([]);
  });

  it("preserves cleanup retry information on read failure", async () => {
    const { state, formData } = fixture();
    state.activity.case_id = null;
    state.caseReadError = true;
    const result = await removeActivityCaseAction({ status: "cleanup_pending", message: "", cleanupCaseId: caseId }, formData);
    expect(result.status).toBe("error");
    expect(result.cleanupCaseId).toBe(caseId);
    expect(state.mutations).toEqual([]);
  });
});
