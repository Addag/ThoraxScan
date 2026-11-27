"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { type LearningNoteActionState, MAX_LEARNING_NOTE_LENGTH } from "@/lib/learning-notes/types";
import { notificationHref, parseNotificationKey } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/server";
import cases from "@/lib/xray-library/cases.json";

const libraryCaseIds = new Set(cases.map((item) => item.id));

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function markNotificationsRead(formData: FormData) {
  const keys = formData.getAll("notification").flatMap((value) => parseNotificationKey(value) ?? []);
  if (keys.length === 0) return keys;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return keys;
  // RLS only accepts activities and submissions the caller can already see.
  await supabase.from("notification_reads").upsert(
    keys.map((key) => ({ user_id: userId, kind: key.kind, ref_id: key.refId })),
    { onConflict: "user_id,kind,ref_id", ignoreDuplicates: true },
  );
  return keys;
}

export async function openNotificationAction(formData: FormData) {
  const [key] = await markNotificationsRead(formData);
  const role = formData.get("role");
  if (!key || (role !== "student" && role !== "professor")) return;
  redirect(notificationHref(key.kind, key.refId, role));
}

export async function markAllNotificationsReadAction(formData: FormData) {
  await markNotificationsRead(formData);
  refresh();
}

// Learning Mode notes are private to their author; RLS enforces it and an empty note deletes the row.
export async function saveLearningNoteAction(
  _previousState: LearningNoteActionState,
  formData: FormData,
): Promise<LearningNoteActionState> {
  const caseId = String(formData.get("caseId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!libraryCaseIds.has(caseId)) return { status: "error", message: "Notes can be saved for sample gallery cases only." };
  if (body.length > MAX_LEARNING_NOTE_LENGTH) return { status: "error", message: `Keep notes to ${MAX_LEARNING_NOTE_LENGTH} characters or fewer.` };

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return { status: "unauthorized", message: "Your session has expired. Log in again before saving notes." };

  const { error } = body
    ? await supabase.from("learning_case_notes").upsert({ user_id: userId, case_id: caseId, body }, { onConflict: "user_id,case_id" })
    : await supabase.from("learning_case_notes").delete().eq("user_id", userId).eq("case_id", caseId);
  if (error) return { status: "error", message: "Unable to save your notes. Try again." };
  return { status: "success", message: body ? "Notes saved." : "Notes cleared.", caseId, body };
}
