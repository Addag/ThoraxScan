import { getActiveAnnouncements } from "@/lib/admin/server";

/** Administrator notices (maintenance and similar) at the top of signed-in pages and the auth pages. */
export async function SiteAnnouncements() {
  const notices = await getActiveAnnouncements();
  if (notices.length === 0) return null;

  return (
    <div role="status" aria-label="Site notices">
      {notices.map((notice) => (
        <p
          key={notice.id}
          className={`m-0 border-b px-[clamp(16px,4vw,54px)] py-2.5 text-small font-semibold ${
            notice.tone === "warning"
              ? "border-[rgb(255_206_75/40%)] bg-[rgb(255_206_75/16%)] text-(--status-warning-text)"
              : "border-[rgb(44_174_255/35%)] bg-[rgb(44_174_255/14%)] text-(--brand-blue-text)"
          }`}
        >
          <span aria-hidden="true">{notice.tone === "warning" ? "⚠ " : "ℹ "}</span>
          {notice.message}
        </p>
      ))}
    </div>
  );
}
