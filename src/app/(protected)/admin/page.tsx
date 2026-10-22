import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { ApplicationReviewForm } from "@/components/admin/application-review-form";
import { EmptyState } from "@/components/empty-state";
import { rejectionReasonClass, reviewFieldClass, reviewPanelClass } from "@/components/admin/review-styles";
import { getProfessorApplications } from "@/lib/admin/server";
import type { ProfessorApplicationProjection } from "@/lib/admin/types";
import type { ProfessorApplicationStatus } from "@/lib/auth/types";
import { requirePlatformAdmin } from "@/lib/auth/server";
import { PageHeading, SectionHeading, StatCard, StatGrid, countBadgeClass , PageMain} from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "Professor approvals | ThoraxScan",
};

const filters = ["pending", "approved", "rejected", "all"] as const;

const statusBadgeColor: Record<ProfessorApplicationStatus, string> = {
  pending: "text-[#ffd166] light:text-(--status-warning-text)",
  approved: "text-[#63e6a4] light:text-(--status-success-text)",
  rejected: "text-[#ff8585] light:text-(--status-error-text)",
};
type ApplicationFilter = (typeof filters)[number];

function isFilter(value: string | undefined): value is ApplicationFilter {
  return filters.includes(value as ApplicationFilter);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const profile = await requirePlatformAdmin();
  const applications = await getProfessorApplications();
  const { status, q } = await searchParams;
  const selectedFilter = isFilter(status) ? status : "pending";
  const query = q?.trim().toLowerCase() ?? "";

  const counts = applications.data.reduce(
    (result, application) => {
      result[application.status] += 1;
      return result;
    },
    { pending: 0, approved: 0, rejected: 0 } satisfies Record<ProfessorApplicationStatus, number>,
  );

  const visibleApplications = applications.data.filter((application) => {
    const matchesStatus =
      selectedFilter === "all" || application.status === selectedFilter;
    const matchesQuery =
      !query ||
      application.display_name.toLowerCase().includes(query) ||
      application.email.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <AdminShell>
      <PageMain bottom="pb-[60px]">
        <PageHeading title="Administrator home" subtitle={`Welcome back, ${profile.display_name}.`} />

        <StatGrid>
          <StatCard symbol="…" value={counts.pending} label="Pending" detail="Awaiting review" />
          <StatCard symbol="✓" value={counts.approved} label="Approved" detail="Professor access granted" />
          <StatCard symbol="×" value={counts.rejected} label="Rejected" detail="May be reconsidered" />
          <StatCard symbol="Σ" value={applications.data.length} label="Total applications" detail="All review states" />
        </StatGrid>

        <section className={`${reviewPanelClass} p-6 max-[560px]:p-[18px]`} aria-labelledby="applications-title">
          <div className="mb-5"><SectionHeading kicker="Account provisioning" title="Professor applications" titleId="applications-title" aside={<span className={countBadgeClass}>{visibleApplications.length} shown</span>} /></div>

          <form className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3" method="get">
            <label className="col-span-full text-[0.75rem] font-extrabold text-(--text-primary)" htmlFor="application-search">Search applicants</label>
            <div className="col-span-full grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[560px]:grid-cols-1">
              <input
                id="application-search"
                name="q"
                type="search"
                defaultValue={q}
                className={`${reviewFieldClass} h-[43px]`}
                placeholder="Name or email"
              />
              <input type="hidden" name="status" value={selectedFilter} />
              <button className="secondary-button transition-[filter] duration-160 not-disabled:hover:brightness-115" type="submit">Search</button>
            </div>
          </form>

          <nav className="my-[18px] flex gap-2 overflow-x-auto pb-0.5" aria-label="Application status filters">
            {filters.map((filter) => (
              <Link
                key={filter}
                className={`transition-colors duration-160 rounded-[999px] border px-[14px] py-2 text-[0.75rem] font-bold no-underline ${selectedFilter === filter ? "border-[#2caeff] bg-[rgba(44,174,255,0.18)] text-(--text-primary)" : "border-[#526078] light:border-(--border-subtle) text-[#c7ccda] light:text-(--text-secondary) hover:bg-(--hover-overlay)"}`}
                href={{ pathname: "/admin", query: { status: filter, ...(q ? { q } : {}) } }}
              >
                {filter[0].toUpperCase() + filter.slice(1)}
              </Link>
            ))}
          </nav>

          {applications.error ? (
            <EmptyState error role="alert" title="Applications are unavailable">Refresh the page or try again later.</EmptyState>
          ) : visibleApplications.length === 0 ? (
            <EmptyState icon="✓" title="No matching applications">There are no Professor applications in this view.</EmptyState>
          ) : (
            <div className="grid gap-[14px]">
              {visibleApplications.map((application) => (
                <ApplicationCard key={application.user_id} application={application} />
              ))}
            </div>
          )}
        </section>
      </PageMain>
    </AdminShell>
  );
}

function ApplicationCard({
  application,
}: {
  application: ProfessorApplicationProjection;
}) {
  return (
    <article className="rounded-[9px] border border-(--border-shell) bg-(--glass-inset) p-[18px] shadow-(--glass-inset-shadow) [&_h3]:m-0">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 max-[560px]:grid-cols-1">
        <span className="grid size-11 place-items-center rounded-full bg-[rgba(44,174,255,0.19)] font-black text-[#75c5ff] light:text-(--brand-blue-text) max-[560px]:hidden" aria-hidden="true">{application.display_name.slice(0, 1).toUpperCase()}</span>
        <div>
          <h3>{application.display_name}</h3>
          <p className="mt-[3px] text-[0.75rem] text-[#9da6b8] light:text-(--text-muted)">{application.email}</p>
        </div>
        <strong className={`rounded-[999px] border border-current px-[9px] py-1.5 text-[0.625rem] leading-[1.4] tracking-[0.06em] uppercase max-[560px]:w-fit ${statusBadgeColor[application.status]}`}>
          {application.status}
        </strong>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2.5 max-[760px]:grid-cols-1">
        <div className="rounded-[6px] bg-[rgba(52,65,85,0.45)] p-2.5"><dt className="text-[0.625rem] text-[#8f99ad] light:text-(--text-muted) uppercase">Requested</dt><dd className="mt-1 text-[0.75rem] font-extrabold">{formatDate(application.requested_at)}</dd></div>
        <div className="rounded-[6px] bg-[rgba(52,65,85,0.45)] p-2.5">
          <dt className="text-[0.625rem] text-[#8f99ad] light:text-(--text-muted) uppercase">Email</dt>
          <dd className="mt-1 text-[0.75rem] font-extrabold">{application.email_confirmed ? "Confirmed" : "Unconfirmed"}</dd>
        </div>
        <div className="rounded-[6px] bg-[rgba(52,65,85,0.45)] p-2.5">
          <dt className="text-[0.625rem] text-[#8f99ad] light:text-(--text-muted) uppercase">Memberships</dt>
          <dd className="mt-1 text-[0.75rem] font-extrabold">{application.membership_count}</dd>
        </div>
      </dl>
      {application.status === "rejected" && application.rejection_reason && (
        <div className={rejectionReasonClass}>
          <strong>Rejection reason</strong>
          <p className="mt-[5px]">{application.rejection_reason}</p>
        </div>
      )}
      {application.status !== "approved" && (
        <ApplicationReviewForm application={application} />
      )}
    </article>
  );
}
