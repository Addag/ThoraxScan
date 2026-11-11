import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { PostNoticeForm, RemoveNoticeForm } from "@/components/admin/administrator-forms";
import { reviewPanelClass } from "@/components/admin/review-styles";
import { badgeClass } from "@/components/controls";
import { PageHeading, PageMain, SectionHeading, countBadgeClass } from "@/components/dashboard-ui";
import { EmptyState } from "@/components/empty-state";
import { getActiveAnnouncements } from "@/lib/admin/server";
import { requirePlatformAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Site notices | ThoraxScan",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default async function AdminNoticesPage() {
  await requirePlatformAdmin();
  const notices = await getActiveAnnouncements();

  return (
    <AdminShell activeItem="notices">
      <PageMain>
        <PageHeading title="Site notices" subtitle="Show a banner on every signed-in page and on the login pages, for example before maintenance." />

        <section className={`${reviewPanelClass} p-6 max-[560px]:p-5`} aria-labelledby="post-notice-title">
          <div className="mb-5"><SectionHeading kicker="Announce" title="Post a notice" titleId="post-notice-title" /></div>
          <PostNoticeForm />
        </section>

        <section className={`${reviewPanelClass} mt-6 p-6 max-[560px]:p-5`} aria-labelledby="active-notices-title">
          <div className="mb-5"><SectionHeading kicker="Live now" title="Active notices" titleId="active-notices-title" aside={<span className={countBadgeClass}>{notices.length}</span>} /></div>
          {notices.length === 0 ? (
            <EmptyState icon="✓" title="No active notices">Nothing is showing on the site right now.</EmptyState>
          ) : (
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {notices.map((notice) => (
                <li key={notice.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-panel border border-(--border-shell) bg-(--glass-inset) px-[18px] py-3.5 max-[560px]:grid-cols-1">
                  <div className="min-w-0">
                    <span className={`${badgeClass} ${notice.tone === "warning" ? "text-(--status-warning-text)" : "text-(--brand-blue-text)"}`}>{notice.tone}</span>
                    <p className="mt-2 mb-0 text-small">{notice.message}</p>
                    <p className="mt-1 mb-0 text-label text-(--text-muted)">{notice.ends_at ? `Hides ${formatDateTime(notice.ends_at)}` : "Shows until removed"}</p>
                  </div>
                  <RemoveNoticeForm noticeId={notice.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageMain>
    </AdminShell>
  );
}
