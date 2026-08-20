import type { Metadata } from "next";
import Link from "next/link";

import {
  ActivityPageHeading,
  ActivityStatusBadge,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { ProfessorShell } from "@/components/professor/professor-shell";
import type { ActivityStatus } from "@/lib/activities/types";
import { getProfessorActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";

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
      <main className="student-dashboard activity-dashboard">
        <ActivityPageHeading description="Create, publish, and archive chest X-ray activities" />

        <section className="activity-list-toolbar" aria-label="Activity filters">
          <form>
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label>
              Workspace
              <select name="workspace" defaultValue={workspaceId}>
                <option value="">All teaching workspaces</option>
                {workspacesResult.data.map((workspace) => (
                  <option value={workspace.id} key={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
            <button type="submit">Apply filter</button>
          </form>
          <Link className="activity-primary-button" href="/professor/activities/new">＋ New activity</Link>
        </section>

        <nav className="activity-status-tabs" aria-label="Activity status">
          <Link className={!status ? "is-active" : ""} href={hrefForStatus(null)}>All <span>{activitiesResult.data.length}</span></Link>
          {(["draft", "published", "archived"] as const).map((item) => (
            <Link className={status === item ? "is-active" : ""} href={hrefForStatus(item)} key={item}>
              {item} <span>{activitiesResult.data.filter((activity) => activity.status === item).length}</span>
            </Link>
          ))}
        </nav>

        {activitiesResult.error || workspacesResult.error ? (
          <div className="activity-empty-state activity-empty-state--error" role="alert">
            <h2>Activities are unavailable</h2>
            <p>Refresh the page or try again later.</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="activity-empty-state">
            <span aria-hidden="true">▣</span>
            <h2>No matching activities</h2>
            <p>Create a draft or change the current workspace and status filters.</p>
          </div>
        ) : (
          <div className="activity-card-grid">
            {filteredActivities.map((activity) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-card__topline">
                  <ActivityStatusBadge status={activity.status} />
                  <span>{activity.hasCase ? "Case attached" : "Case required"}</span>
                </div>
                <p>{activity.workspaceName}</p>
                <h2>{activity.title}</h2>
                <dl>
                  <div><dt>Due</dt><dd>{formatDueDate(activity.dueAt)}</dd></div>
                  <div><dt>Updated</dt><dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(activity.updatedAt))}</dd></div>
                </dl>
                <Link href={`/professor/activities/${activity.id}`}>Open activity <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </ProfessorShell>
  );
}
