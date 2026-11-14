import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { reviewPanelClass } from "@/components/admin/review-styles";
import { button } from "@/components/controls";
import { PageHeading, PageMain, SectionHeading, StatCard, StatGrid, countBadgeClass } from "@/components/dashboard-ui";
import { EmptyState } from "@/components/empty-state";
import { getAdminActions, getPlatformEvents, getPlatformStats, getProfessorReport } from "@/lib/admin/server";
import { requirePlatformAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Administrator home | ThoraxScan",
};

const eventSymbol: Record<string, string> = { account: "+", workspace: "▦", activity: "▶", submission: "✓", feedback: "★" };
const cellClass = "border-b border-(--border-subtle) px-3 py-2.5 text-left";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default async function AdminPage() {
  const profile = await requirePlatformAdmin();
  const [stats, report, events, actions] = await Promise.all([getPlatformStats(), getProfessorReport(), getPlatformEvents(), getAdminActions()]);
  const totals = stats.data[0];

  return (
    <AdminShell activeItem="home">
      <PageMain>
        <PageHeading title="Administrator home" subtitle={`Welcome back, ${profile.display_name}.`} />

        {stats.error || !totals ? (
          <EmptyState error role="alert" title="Platform totals are unavailable">Refresh the page or try again later.</EmptyState>
        ) : (
          <StatGrid>
            <StatCard symbol="S" value={totals.students} label="Students" detail={`${totals.new_accounts_30d} new accounts in the last 30 days`} />
            <StatCard symbol="P" value={totals.professors_approved} label="Professors" detail={totals.professors_pending ? `${totals.professors_pending} waiting for approval` : "No pending applications"} />
            <StatCard symbol="▦" value={totals.workspaces} label="Workspaces" detail={`${totals.administrators} administrator${totals.administrators === 1 ? "" : "s"}`} />
            <StatCard symbol="▶" value={totals.activities_published} label="Published activities" detail={`${totals.activities_draft} draft${totals.activities_draft === 1 ? "" : "s"}`} />
            <StatCard symbol="✓" value={totals.final_submissions} label="Final submissions" detail={`${totals.feedback_released} with released feedback`} />
          </StatGrid>
        )}

        {totals?.professors_pending ? (
          <p className="mt-4 mb-0 text-small">
            <Link className="font-extrabold text-(--brand-blue-text)" href="/admin/applications">Review {totals.professors_pending} pending Professor application{totals.professors_pending === 1 ? "" : "s"} →</Link>
          </p>
        ) : null}

        <section className={`${reviewPanelClass} mt-6 p-6 max-[560px]:p-5`} aria-labelledby="report-title">
          <div className="mb-5">
            <SectionHeading
              kicker="Detailed report"
              title="Professors"
              titleId="report-title"
              aside={<a className={button("secondary")} href="/admin/report" download>Download CSV</a>}
            />
          </div>
          {report.error ? (
            <EmptyState error role="alert" title="The report is unavailable">Refresh the page or try again later.</EmptyState>
          ) : report.data.length === 0 ? (
            <EmptyState icon="✓" title="No approved Professors yet">Approved Professors appear here with their workspace totals.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-small">
                <thead className="text-label uppercase tracking-[0.08em] text-(--text-muted)">
                  <tr>
                    <th className={cellClass} scope="col">Professor</th>
                    <th className={`${cellClass} text-right`} scope="col">Workspaces</th>
                    <th className={`${cellClass} text-right`} scope="col">Students</th>
                    <th className={`${cellClass} text-right`} scope="col">Activities</th>
                    <th className={`${cellClass} text-right`} scope="col">Submissions</th>
                    <th className={`${cellClass} text-right`} scope="col">Feedback released</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {report.data.map((row) => (
                    <tr key={row.user_id}>
                      <th className={cellClass} scope="row">
                        <span className="block font-extrabold">{row.display_name}</span>
                        <span className="block text-label font-normal text-(--text-muted)">{row.email}</span>
                      </th>
                      <td className={`${cellClass} text-right`}>{row.workspaces}</td>
                      <td className={`${cellClass} text-right`}>{row.students}</td>
                      <td className={`${cellClass} text-right`}>{row.activities}</td>
                      <td className={`${cellClass} text-right`}>{row.final_submissions}</td>
                      <td className={`${cellClass} text-right`}>{row.feedback_released}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 grid grid-cols-2 gap-6 max-[1100px]:grid-cols-1">
          <section className={`${reviewPanelClass} p-6 max-[560px]:p-5`} aria-labelledby="events-title">
            <div className="mb-4"><SectionHeading kicker="Overview" title="Platform activity" titleId="events-title" aside={<span className={countBadgeClass}>Latest {events.data.length}</span>} /></div>
            {events.error ? (
              <EmptyState error role="alert" title="Activity is unavailable">Refresh the page or try again later.</EmptyState>
            ) : events.data.length === 0 ? (
              <EmptyState icon="✓" title="Nothing yet">Sign-ups, workspaces, activities, submissions, and feedback appear here.</EmptyState>
            ) : (
              <ol className="m-0 grid list-none gap-1 p-0">
                {events.data.map((event, index) => (
                  <li key={`${event.at}-${index}`} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2.5 rounded-control px-1 py-2">
                    <span className="grid size-7 place-items-center rounded-full bg-(--surface-sunken) text-label font-extrabold" aria-hidden="true">{eventSymbol[event.kind] ?? "•"}</span>
                    <span className="min-w-0">
                      <span className="block text-small">{event.summary}</span>
                      <time className="block text-label text-(--text-muted)" dateTime={event.at}>{formatDateTime(event.at)}</time>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={`${reviewPanelClass} min-w-0 p-6 max-[560px]:p-5`} aria-labelledby="actions-title">
            <div className="mb-4"><SectionHeading kicker="Audit" title="Admin actions" titleId="actions-title" aside={<span className={countBadgeClass}>Latest {actions.data.length}</span>} /></div>
            {actions.error ? (
              <EmptyState error role="alert" title="The log is unavailable">Refresh the page or try again later.</EmptyState>
            ) : actions.data.length === 0 ? (
              <EmptyState icon="✓" title="No admin actions yet">Approvals, account changes, and notices are recorded here.</EmptyState>
            ) : (
              <ol className="m-0 grid list-none gap-1 p-0">
                {actions.data.map((entry, index) => (
                  <li key={`${entry.created_at}-${index}`} className="min-w-0 rounded-control px-1 py-2">
                    <span className="block text-small"><strong>{entry.actor_name}</strong> · {entry.action}{entry.target_label ? ` · ${entry.target_label}` : ""}</span>
                    {entry.detail ? <span className="block truncate text-label text-(--text-secondary)">{entry.detail}</span> : null}
                    <time className="block text-label text-(--text-muted)" dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </PageMain>
    </AdminShell>
  );
}
