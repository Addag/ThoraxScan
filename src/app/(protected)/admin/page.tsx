import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { ApplicationReviewForm } from "@/components/admin/application-review-form";
import { EmptyState } from "@/components/empty-state";
import { getProfessorApplications } from "@/lib/admin/server";
import type { ProfessorApplicationProjection } from "@/lib/admin/types";
import type { ProfessorApplicationStatus } from "@/lib/auth/types";
import { requirePlatformAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Professor approvals | ThoraxScan",
};

const filters = ["pending", "approved", "rejected", "all"] as const;

const statusBadgeColor: Record<ProfessorApplicationStatus, string> = {
  pending: "text-[#ffd166]",
  approved: "text-[#63e6a4]",
  rejected: "text-[#ff8585]",
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
      <main className="student-dashboard admin-dashboard">
        <div className="student-page-heading">
          <div>
            <h1>Administrator dashboard</h1>
            <p>Welcome back, {profile.display_name}.</p>
          </div>
          <time dateTime={new Date().toISOString().slice(0, 10)}>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(new Date())}
          </time>
        </div>

        <section className="professor-stat-grid admin-stat-grid" aria-label="Professor application overview">
          <StatCard symbol="…" value={counts.pending} label="Pending" detail="Awaiting review" />
          <StatCard symbol="✓" value={counts.approved} label="Approved" detail="Professor access granted" />
          <StatCard symbol="×" value={counts.rejected} label="Rejected" detail="May be reconsidered" />
          <StatCard symbol="Σ" value={applications.data.length} label="Total applications" detail="All review states" />
        </section>

        <section className="admin-applications-panel" aria-labelledby="applications-title">
          <div className="student-section-heading admin-applications-heading">
            <div>
              <p className="student-section-kicker">Account provisioning</p>
              <h2 id="applications-title">Professor applications</h2>
            </div>
            <span>{visibleApplications.length} shown</span>
          </div>

          <form className="admin-application-tools" method="get">
            <label htmlFor="application-search">Search applicants</label>
            <div>
              <input
                id="application-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Name or email"
              />
              <input type="hidden" name="status" value={selectedFilter} />
              <button className="secondary-button" type="submit">Search</button>
            </div>
          </form>

          <nav className="admin-application-filters" aria-label="Application status filters">
            {filters.map((filter) => (
              <Link
                key={filter}
                className={selectedFilter === filter ? "is-active" : undefined}
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
            <div className="admin-application-list">
              {visibleApplications.map((application) => (
                <ApplicationCard key={application.user_id} application={application} />
              ))}
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

function StatCard({
  symbol,
  value,
  label,
  detail,
}: {
  symbol: string;
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <article>
      <span aria-hidden="true">{symbol}</span>
      <strong>{value}</strong>
      <p>{label}</p>
      <small>{detail}</small>
    </article>
  );
}

function ApplicationCard({
  application,
}: {
  application: ProfessorApplicationProjection;
}) {
  return (
    <article className="admin-application-card">
      <div className="admin-application-card__identity">
        <span aria-hidden="true">{application.display_name.slice(0, 1).toUpperCase()}</span>
        <div>
          <h3>{application.display_name}</h3>
          <p>{application.email}</p>
        </div>
        <strong className={`rounded-[999px] border border-current px-[9px] py-1.5 text-[10px] leading-[1.4] tracking-[0.06em] uppercase max-[560px]:w-fit ${statusBadgeColor[application.status]}`}>
          {application.status}
        </strong>
      </div>
      <dl className="admin-application-card__facts">
        <div><dt>Requested</dt><dd>{formatDate(application.requested_at)}</dd></div>
        <div>
          <dt>Email</dt>
          <dd>{application.email_confirmed ? "Confirmed" : "Unconfirmed"}</dd>
        </div>
        <div>
          <dt>Memberships</dt>
          <dd>{application.membership_count}</dd>
        </div>
      </dl>
      {application.status === "rejected" && application.rejection_reason && (
        <div className="admin-application-card__reason">
          <strong>Rejection reason</strong>
          <p>{application.rejection_reason}</p>
        </div>
      )}
      {application.status !== "approved" && (
        <ApplicationReviewForm application={application} />
      )}
    </article>
  );
}
