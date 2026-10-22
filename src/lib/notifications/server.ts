import "server-only";

import type { AppRole } from "@/lib/auth/types";
import { notificationWindowMs, type AppNotification, type NotificationsResult } from "@/lib/notifications/types";
import type { SubmissionStatus } from "@/lib/submissions/types";
import { createClient } from "@/lib/supabase/server";

type DueRow = { id: string; title: string; due_at: string; workspaces: { name: string }; student_submissions: { status: SubmissionStatus }[] };
type SubmissionRow = {
  id: string; submitted_at: string;
  profiles: { display_name: string } | null;
  activities: { title: string; workspaces: { name: string } };
};

/** Activities due in the next 7 days (Students: not yet submitted), plus Professors' final submissions from the last 7 days. */
export async function getNotifications(role: AppRole): Promise<NotificationsResult> {
  const unavailable = { role, data: [], error: "Notifications are unavailable." };
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return unavailable;

  const now = Date.now();
  const [dues, submissions] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, due_at, workspaces!inner(name), student_submissions(status)")
      .eq("status", "published")
      .gt("due_at", new Date(now).toISOString())
      .lte("due_at", new Date(now + notificationWindowMs).toISOString())
      .eq("student_submissions.student_id", userId)
      .order("due_at")
      .returns<DueRow[]>(),
    role === "professor"
      ? supabase
        .from("student_submissions")
        .select("id, submitted_at, profiles!student_submissions_student_id_fkey(display_name), activities!inner(title, workspaces!inner(name))")
        .eq("status", "submitted")
        .gte("submitted_at", new Date(now - notificationWindowMs).toISOString())
        .order("submitted_at", { ascending: false })
        // ponytail: newest 20 only; Student Reviews lists the rest.
        .limit(20)
        .returns<SubmissionRow[]>()
      : { data: [] as SubmissionRow[], error: null },
  ]);
  if (dues.error || submissions.error) return unavailable;

  const items: Omit<AppNotification, "read">[] = [
    ...dues.data
      .filter((row) => row.student_submissions[0]?.status !== "submitted")
      .map((row) => ({ kind: "activity_due" as const, refId: row.id, title: row.title, detail: row.workspaces.name, at: row.due_at })),
    ...submissions.data.map((row) => ({
      kind: "submission" as const,
      refId: row.id,
      title: row.activities.title,
      detail: `${row.profiles?.display_name ?? "A Student"} submitted · ${row.activities.workspaces.name}`,
      at: row.submitted_at,
    })),
  ];
  if (items.length === 0) return { role, data: [], error: null };

  const reads = await supabase.from("notification_reads").select("kind, ref_id").in("ref_id", items.map((item) => item.refId));
  if (reads.error) return unavailable;
  const readKeys = new Set(reads.data.map((row) => `${row.kind}:${row.ref_id}`));
  return { role, data: items.map((item) => ({ ...item, read: readKeys.has(`${item.kind}:${item.refId}`) })), error: null };
}
