import type { Metadata } from "next";
import Link from "next/link";

import {
  ActivityPageHeading,
  ActivityStatusBadge,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { EmptyState } from "@/components/empty-state";
import type { ActivityStatus } from "@/lib/activities/types";
import { getProfessorActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { activityButton } from "@/components/activities/activity-button";
import { glassPanelClass , PageMain} from "@/components/dashboard-ui";

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
        <ActivityPageHeading description="Create, publish, and archive chest X-ray activities" />

        <section className="mb-5 flex items-end justify-between gap-6 rounded-[10px] border border-[#33425c] bg-[#18202d] px-5 py-[18px] max-[760px]:flex-col max-[760px]:items-stretch" aria-label="Activity filters">
          <form className="flex items-end gap-3 max-[760px]:flex-col max-[760px]:items-stretch">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label className="grid gap-[7px] text-[11px] text-[#9fa7b5]">
              Workspace
              <select className="min-h-[39px] min-w-[250px] rounded-[5px] border border-[#6d7480] bg-[#111927] px-[13px] text-white max-[760px]:w-full max-[760px]:min-w-0" name="workspace" defaultValue={workspaceId}>
                <option value="">All teaching workspaces</option>
                {workspacesResult.data.map((workspace) => (
                  <option value={workspace.id} key={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
            <button className="min-h-[39px] cursor-pointer rounded-[5px] border border-[#6d7480] bg-[#111927] px-[13px] font-extrabold text-white" type="submit">Apply filter</button>
          </form>
          <Link className={activityButton.primary} href="/professor/activities/new">＋ New activity</Link>
        </section>

        <nav className="mb-5 flex gap-2 overflow-x-auto" aria-label="Activity status">
          <Link className={`inline-flex min-h-[37px] items-center gap-2 rounded-[6px] border px-[13px] text-[12px] font-extrabold capitalize no-underline ${!status ? "border-brand bg-[rgba(0,119,255,0.18)] text-white" : "border-[#465269] text-[#aeb6c5]"}`} href={hrefForStatus(null)}>All <span className="rounded-[999px] bg-[rgba(255,255,255,0.1)] px-[7px] py-[3px]">{activitiesResult.data.length}</span></Link>
          {(["draft", "published", "archived"] as const).map((item) => (
            <Link className={`inline-flex min-h-[37px] items-center gap-2 rounded-[6px] border px-[13px] text-[12px] font-extrabold capitalize no-underline ${status === item ? "border-brand bg-[rgba(0,119,255,0.18)] text-white" : "border-[#465269] text-[#aeb6c5]"}`} href={hrefForStatus(item)} key={item}>
              {item} <span className="rounded-[999px] bg-[rgba(255,255,255,0.1)] px-[7px] py-[3px]">{activitiesResult.data.filter((activity) => activity.status === item).length}</span>
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
              <article className={`${glassPanelClass} border-[#33425c] p-5`} key={activity.id}>
                <div className="flex items-center justify-between gap-3">
                  <ActivityStatusBadge status={activity.status} />
                  <span className="text-[11px] leading-[1.4] text-[#c4d0e0]">{activity.hasCase ? "Case attached" : "Case required"}</span>
                </div>
                <p className="mx-0 mt-[22px] mb-[5px] text-[11px] leading-[1.4] text-[#c4d0e0]">{activity.workspaceName}</p>
                <h2 className="m-0 min-h-12 text-[20px] leading-[1.2]">{activity.title}</h2>
                <dl className="my-5 grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
                  <div className="rounded-[5px] bg-[#111927] p-2.5"><dt className="text-[9px] uppercase leading-[1.4] tracking-[0.06em] text-[#c4d0e0]">Due</dt><dd className="mx-0 mt-1 mb-0 text-[11px] leading-[1.4]">{formatDueDate(activity.dueAt)}</dd></div>
                  <div className="rounded-[5px] bg-[#111927] p-2.5"><dt className="text-[9px] uppercase leading-[1.4] tracking-[0.06em] text-[#c4d0e0]">Updated</dt><dd className="mx-0 mt-1 mb-0 text-[11px] leading-[1.4]">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(activity.updatedAt))}</dd></div>
                </dl>
                <Link className="flex items-center justify-between text-[12px] font-extrabold text-[#70bdff] no-underline" href={`/professor/activities/${activity.id}`}>Open activity <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </PageMain>
    </ProfessorShell>
  );
}
