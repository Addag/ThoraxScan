import { markAllNotificationsReadAction, openNotificationAction } from "@/app/(protected)/actions";
import { formatDueDate } from "@/components/activities/activity-ui";
import type { AppRole } from "@/lib/auth/types";
import type { AppNotification, NotificationsResult } from "@/lib/notifications/types";

// Native popover: light dismiss, Escape, and focus return come from the browser, so this stays a Server Component.
const panelId = "notifications-panel";

const urgentMs = 86_400_000;

type Group = {
  key: string;
  label: string;
  empty: string | null;
  roles: readonly AppRole[];
  verb: string;
  matches: (item: AppNotification, now: number) => boolean;
};

const isDue = (item: AppNotification) => item.kind === "activity_due";

// A null `empty` hides the group when it has nothing to show.
const groups: Group[] = [
  { key: "missed", label: "Missed deadlines", empty: null, roles: ["student"], verb: "Was due", matches: (item, now) => isDue(item) && Date.parse(item.at) <= now },
  { key: "due", label: "Due in the next 7 days", empty: "Nothing due in the next 7 days.", roles: ["student", "professor"], verb: "Due", matches: (item, now) => isDue(item) && Date.parse(item.at) > now },
  { key: "feedback", label: "New feedback", empty: "No new feedback in the last 7 days.", roles: ["student"], verb: "Released", matches: (item) => item.kind === "feedback" },
  { key: "submission", label: "New submissions", empty: "No submissions in the last 7 days.", roles: ["professor"], verb: "Submitted", matches: (item) => item.kind === "submission" },
];

/** Missed deadlines and anything due within 24 hours are shown in red. */
function isUrgent(item: AppNotification, now: number) {
  return isDue(item) && Date.parse(item.at) - now < urgentMs;
}

/** Bell for the app header and the mobile menu bar; both open the one panel. */
export function NotificationBellButton({ unread, className = "size-10" }: { unread: number; className?: string }) {
  return (
    <button
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      className={`${className} transition-colors duration-160 relative grid flex-none cursor-pointer place-items-center rounded-full border border-(--border-shell) bg-transparent text-(--text-primary) hover:bg-(--hover-overlay)`}
      popoverTarget={panelId}
      type="button"
    >
      <svg className="size-5 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      {unread ? (
        <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ff5457] px-1 text-label leading-none font-extrabold text-white" aria-hidden="true">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}

export function NotificationPanel({ notifications }: { notifications: NotificationsResult }) {
  const { role, now } = notifications;
  const unread = notifications.data.filter((item) => !item.read);

  return (
    <div
      aria-label="Notifications"
      className="fixed inset-auto top-[84px] right-[clamp(22px,4vw,54px)] m-0 max-h-[min(520px,calc(100svh-100px))] w-[min(360px,calc(100vw-32px))] overflow-y-auto rounded-panel border border-(--border-shell) bg-(--surface-raised) p-0 pb-1.5 text-(--text-primary) shadow-(--glass-shadow) max-[850px]:top-[68px] max-[850px]:right-4"
      id={panelId}
      popover="auto"
    >
      <div className="flex items-center justify-between gap-3 border-b border-b-(--border-subtle) px-4 py-3">
        <strong className="text-body">Notifications</strong>
        {unread.length ? (
          <form action={markAllNotificationsReadAction}>
            {unread.map((item) => <input key={item.refId} name="notification" type="hidden" value={`${item.kind}:${item.refId}`} />)}
            <button className="cursor-pointer border-0 bg-transparent p-0 text-caption font-extrabold text-(--brand-blue-text) hover:underline" type="submit">Mark all read</button>
          </form>
        ) : null}
      </div>
      {notifications.error ? (
        <p className="m-0 px-4 py-3 text-caption text-(--text-muted)" role="alert">{notifications.error}</p>
      ) : (
        groups.filter((group) => group.roles.includes(role)).map((group) => {
          const items = notifications.data.filter((item) => group.matches(item, now));
          if (items.length === 0 && group.empty === null) return null;
          return (
            <section aria-label={group.label} key={group.key}>
              <h3 className={`m-0 px-4 pt-3 pb-1 text-label font-extrabold tracking-[0.08em] uppercase ${group.key === "missed" ? "text-(--status-error-text)" : "text-(--text-secondary)"}`}>{group.label}</h3>
              {items.length === 0 ? (
                <p className="m-0 px-4 pb-2 text-caption text-(--text-muted)">{group.empty}</p>
              ) : (
                <ul className="m-0 list-none p-0">
                  {items.map((item) => (
                    <li key={`${item.kind}:${item.refId}`}>
                      <form action={openNotificationAction}>
                        <input name="role" type="hidden" value={role} />
                        <input name="notification" type="hidden" value={`${item.kind}:${item.refId}`} />
                        <button className="transition-colors duration-160 grid w-full cursor-pointer grid-cols-[8px_minmax(0,1fr)] gap-x-2.5 border-0 bg-transparent px-4 py-2.5 text-left text-(--text-primary) hover:bg-(--hover-overlay)" type="submit">
                          <span className={`mt-1.5 size-2 rounded-full ${isUrgent(item, now) ? "bg-[#ff5457]" : item.read ? "" : "bg-brand"}`} aria-hidden="true" />
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className={`truncate text-small ${item.read ? "font-semibold text-(--text-secondary)" : "font-extrabold"}`}>
                              {item.title}{item.read ? null : <span className="sr-only"> (unread)</span>}
                            </span>
                            <span className="truncate text-label text-(--text-muted)">{item.detail}</span>
                            <span className={`text-label ${isUrgent(item, now) ? "font-extrabold text-(--status-error-text)" : "text-(--text-muted)"}`}>
                              {group.verb} {formatDueDate(item.at)}
                            </span>
                          </span>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
