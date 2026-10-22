"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { notificationHref, parseNotificationKey } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/server";

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
