import type { AppRole } from "@/lib/auth/types";

export type NotificationKind = "activity_due" | "submission";
export type AppNotification = {
  kind: NotificationKind;
  refId: string;
  title: string;
  detail: string;
  /** due_at for activity_due, submitted_at for submission. */
  at: string;
  read: boolean;
};
export type NotificationsResult = { role: AppRole; data: AppNotification[]; error: string | null };

export const notificationWindowMs = 7 * 86_400_000;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Form value is `kind:refId`; anything else is dropped. */
export function parseNotificationKey(value: unknown) {
  const [kind, refId = ""] = String(value).split(":");
  return (kind === "activity_due" || kind === "submission") && uuidPattern.test(refId)
    ? { kind: kind as NotificationKind, refId }
    : null;
}

export function notificationHref(kind: NotificationKind, refId: string, role: AppRole) {
  return kind === "submission" ? `/professor/submissions/${refId}` : `/${role}/activities/${refId}`;
}
