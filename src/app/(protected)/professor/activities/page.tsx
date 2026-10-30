import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm } from "@/components/filter-form";

import {
  ActivityStatusBadge,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { EmptyState } from "@/components/empty-state";
import type { ActivityStatus } from "@/lib/activities/types";
import { getProfessorActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { button, field } from "@/components/controls";
import { glassPanelClass, PageHeading, PageMain } from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "Activities | ThoraxScan",
};

const activityStatuses = new Set<ActivityStatus>(["draft", "published", "archived"]);

export default async function ProfessorActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole("professor");
  const params = await searchParams;
  const [workspacesResult, activitiesResult] = await Promise.all([
    getProfessorWorkspaces(profile.id),
    getProfessorActivities(),
  ]);

  const workspaceId =
    typeof params.workspace === "string" &&
    workspacesResult.data.some((workspace) => workspace.id === params.workspace)
      ? params.workspace
      : "";
  const status =
    typeof params.status === "string" && activityStatuses.has(params.status as ActivityStatus)
      ? (params.status as ActivityStatus)
      : null;
  const filteredActivities = activitiesResult.data.filter(
    (activity) =>
      (!workspaceId || activity.workspaceId === workspaceId) &&
      (!status || activity.status === status),
  );

  const hrefForStatus = (nextStatus: ActivityStatus | null) => {
    const query = new URLSearchParams();
    if (workspaceId) query.set("workspace", workspaceId);
    if (nextStatus) query.set("status", nextStatus);
    const suffix = query.toString();
    return suffix ? `/professor/activities?${suffix}` : "/professor/activities";
  };

  return (
    <ProfessorShell activeItem="activities" sectionLabel="Activities" sectionDescription="Case-backed learning activities">
      <PageMain>
        <PageHeading title="Activities" subtitle="Create, publish, and archive chest X-ray activities" />

        <section className="mb-5 flex items-end justify-between gap-6 rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow) px-5 py-[18px] max-[760px]:flex-col max-[760px]:items-stretch" aria-label="Activity filters">
          <FilterForm>
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label className="grid w-[250px] gap-[7px] text-label text-(--text-muted) max-[760px]:w-full">
              Workspace
              <select className={field} name="workspace" defaultValue={workspaceId}>
                <option value="">All teaching workspaces</option>
                {workspacesResult.data.map((workspace) => (
                  <option value={workspace.id} key={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
          </FilterForm>
          <Link className={button("primary")} href="/professor/activities/new">＋ New activity</Link>
        </section>

        <nav className="mb-5 flex gap-2 overflow-x-auto" aria-label="Activity status">
          <Link className={`transition-colors duration-160 inline-flex min-h-10 items-center gap-2 rounded-control border px-[13px] text-caption font-extrabold capitalize no-underline ${!status ? "border-brand bg-[rgba(0,119,255,0.18)] text-(--text-primary)" : "border-(--border-subtle) text-(--text-muted) hover:bg-(--hover-overlay)"}`} href={hrefForStatus(null)}>All <span className="rounded-full bg-(--hover-overlay) px-[7px] py-[3px]">{activitiesResult.data.length}</span></Link>
          {(["draft", "published", "archived"] as const).map((item) => (
            <Link className={`transition-colors duration-160 inline-flex min-h-10 items-center gap-2 rounded-control border px-[13px] text-caption font-extrabold capitalize no-underline ${status === item ? "border-brand bg-[rgba(0,119,255,0.18)] text-(--text-primary)" : "border-(--border-subtle) text-(--text-muted) hover:bg-(--hover-overlay)"}`} href={hrefForStatus(item)} key={item}>
              {item} <span className="rounded-full bg-(--hover-overlay) px-[7px] py-[3px]">{activitiesResult.data.filter((activity) => activity.status === item).length}</span>
            </Link>
          ))}
        </nav>

        {activitiesResult.error || workspacesResult.error ? (
          <EmptyState variant="card" error role="alert" title="Activities are unavailable">Refresh the page or try again later.</EmptyState>
        ) : filteredActivities.length === 0 ? (
          <EmptyState variant="card" icon="▣" title="No matching activities">Create a draft or change the current workspace and status filters.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-[18px] max-[760px]:grid-cols-1">
            {filteredActivities.map((activity) => (
              <article className={`${glassPanelClass} border-(--border-shell) p-5`} key={activity.id}>
                <div className="flex items-center justify-between gap-3">
                  <ActivityStatusBadge status={activity.status} />
                  <span className="text-label leading-snug text-(--text-secondary)">{activity.hasCase ? "Case attached" : "Case required"}</span>
                </div>
                <p className="mx-0 mt-[22px] mb-[5px] text-label leading-snug text-(--text-secondary)">{activity.workspaceName}</p>
                <h2 className="m-0 min-h-12 text-title leading-tight">{activity.title}</h2>
                <dl className="my-5 grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
                  <div className="rounded-control bg-(--surface-sunken) p-2.5"><dt className="text-label uppercase leading-snug tracking-[0.08em] text-(--text-secondary) font-extrabold">Due</dt><dd className="mx-0 mt-1 mb-0 text-label leading-snug">{formatDueDate(activity.dueAt)}</dd></div>
                  <div className="rounded-control bg-(--surface-sunken) p-2.5"><dt className="text-label uppercase leading-snug tracking-[0.08em] text-(--text-secondary) font-extrabold">Updated</dt><dd className="mx-0 mt-1 mb-0 text-label leading-snug">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(activity.updatedAt))}</dd></div>
                </dl>
                <Link className="transition-colors duration-160 hover:text-(--text-primary) flex items-center justify-between text-caption font-extrabold text-(--brand-blue-text) no-underline" href={`/professor/activities/${activity.id}`}>Open activity <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </PageMain>
    </ProfessorShell>
  );
}
