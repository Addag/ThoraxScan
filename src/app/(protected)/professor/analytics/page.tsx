import Link from "next/link";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeading, PageMain, StatCard, StatGrid, glassPanelClass } from "@/components/dashboard-ui";
import { requireRole } from "@/lib/auth/server";
import { getProfessorActivities } from "@/lib/activities/server";
import { getClassAnalytics } from "@/lib/analytics/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { reviewButtonSolid, reviewFieldClass, reviewFieldLabelClass, reviewHeadingClass, reviewLinkClass, reviewPanelTextClass } from "@/components/professor/review-styles";

export const metadata = { title: "Class Analytics | ThoraxScan" };

const panelClass = `${glassPanelClass} border-[rgb(137_161_196/42%)] mt-[18px] overflow-hidden p-0`;
const panelHeaderClass = "border-b border-b-(--border-subtle) px-[18px] py-[11px]";
const tableClass = "w-full border-collapse text-left text-[0.75rem] [&_td]:px-[18px] [&_td]:py-2.5 [&_th]:px-[18px] [&_th]:py-2.5 [&_th]:font-extrabold [&_th]:text-[#b7c5d9] light:[&_th]:text-(--text-muted) [&_tbody_tr]:border-t [&_tbody_tr]:border-t-(--border-subtle)";
const show = (value: number | null, suffix = "") => (value === null ? "—" : `${value}${suffix}`);

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await requireRole("professor");
  const params = await searchParams;
  const workspaces = await getProfessorWorkspaces(profile.id);
  const workspaceId = typeof params.workspace === "string" && params.workspace ? params.workspace : workspaces.data[0]?.id ?? "";
  const activityId = typeof params.activity === "string" ? params.activity : "";
  const [analytics, activities] = workspaceId
    ? await Promise.all([getClassAnalytics(profile.id, workspaceId, activityId), getProfessorActivities({ workspaceId })])
    : [null, null];
  const summary = analytics?.data;
  const exportQuery = new URLSearchParams({ workspace: workspaceId, ...(activityId ? { activity: activityId } : {}) });

  return <ProfessorShell activeItem="analytics" sectionLabel="Class Analytics" sectionDescription="Monitor class progress">
    <PageMain>
      <PageHeading title="Class Analytics" subtitle="Completion, scores, and AI agreement for a workspace" />
      {workspaces.error ? <EmptyState error role="alert" title="Workspaces are unavailable">Refresh the page or try again later.</EmptyState>
        : !workspaceId ? <EmptyState icon="＋" title="No teaching workspaces yet">Create a workspace to see class analytics.</EmptyState>
        : <>
          <section className={`${panelClass} mt-0`} aria-labelledby="analytics-filters-heading">
            <div className={panelHeaderClass}><h2 className={reviewHeadingClass} id="analytics-filters-heading">Scope</h2></div>
            <form className="grid grid-cols-[repeat(2,minmax(0,1fr))_auto] gap-3 px-[18px] pt-3.5 pb-[17px] max-[600px]:grid-cols-1" method="get">
              <label className={reviewFieldLabelClass}>Workspace<select className={reviewFieldClass} name="workspace" defaultValue={workspaceId}>{workspaces.data.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
              <label className={reviewFieldLabelClass}>Activity<select className={reviewFieldClass} name="activity" defaultValue={activityId}><option value="">All activities</option>{activities?.data.filter(activity => activity.status !== "draft").map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label>
              <div className="flex items-end gap-2.5 pb-px"><button className={reviewButtonSolid} type="submit">Apply</button></div>
            </form>
          </section>
          {analytics?.error ? <p className="mt-[18px]" role="alert">{analytics.error}</p> : null}
          {summary ? <>
            <div className="mt-[18px]"><StatGrid>
              <StatCard symbol="✓" value={show(summary.totals.completion, "%")} label="Completion" detail={`${summary.totals.submitted} of ${summary.totals.expected} final submissions · ${summary.totals.missing} missing`} />
              <StatCard symbol="⏱" value={show(summary.totals.onTime, "%")} label="On time" detail={`${summary.totals.late} submitted after the due date`} />
              <StatCard symbol="★" value={show(summary.totals.averageScore)} label="Average released score" detail={summary.totals.averageScore === null ? "No released evaluations yet" : `Range ${summary.totals.minScore}–${summary.totals.maxScore}`} />
              <StatCard symbol="!" value={summary.totals.review.unreviewed + summary.totals.review.draft} label="Awaiting review" detail={`${summary.totals.review.unreviewed} unreviewed · ${summary.totals.review.draft} draft · ${summary.totals.review.released} released`} />
              <StatCard symbol="AI" value={show(summary.totals.agreement, "%")} label="Student vs. AI agreement" detail={`Normal/abnormal call, ${summary.totals.compared} comparisons. AI output is a model prediction, not ground truth.`} />
            </StatGrid></div>

            <section className={panelClass} aria-labelledby="analytics-activities-heading">
              <div className={panelHeaderClass}><h2 className={reviewHeadingClass} id="analytics-activities-heading">By activity</h2></div>
              {summary.perActivity.length === 0 ? <p className={`${reviewPanelTextClass} px-[18px] pt-3.5`}>No published activities in this workspace.</p> : <div className="overflow-x-auto"><table className={tableClass}>
                <thead><tr><th scope="col">Activity</th><th scope="col">Submitted</th><th scope="col">Late</th><th scope="col">Missing</th><th scope="col">Avg score</th><th scope="col">AI call</th><th scope="col">Agreement</th></tr></thead>
                <tbody>{summary.perActivity.map(row => {
                  const completion = row.roster ? Math.round((row.submitted / row.roster) * 100) : 0;
                  return <tr key={row.id}>
                    <th scope="row" className="font-normal! text-(--text-primary)!"><Link className={reviewLinkClass} href={`/professor/submissions?workspace=${workspaceId}&activity=${row.id}`}>{row.title}</Link>{row.dueAt ? <small className="block text-[0.6875rem] text-(--text-muted)">Due <time dateTime={row.dueAt}>{new Date(row.dueAt).toLocaleDateString()}</time></small> : null}</th>
                    <td><span className="block min-w-[110px]">{row.submitted}/{row.roster} ({completion}%)</span><span className="mt-1 block h-1.5 rounded-full bg-(--border-subtle)" aria-hidden="true"><span className="block h-full rounded-full bg-[#087fff]" style={{ width: `${completion}%` }} /></span></td>
                    <td>{row.late}</td><td>{row.missing}</td><td>{show(row.averageScore)}</td><td className="capitalize">{row.aiCall ?? "—"}</td><td>{show(row.agreement, "%")}</td>
                  </tr>;
                })}</tbody>
              </table></div>}
            </section>

            <section className={panelClass} aria-labelledby="analytics-students-heading">
              <div className={`${panelHeaderClass} flex items-center justify-between gap-4`}><h2 className={reviewHeadingClass} id="analytics-students-heading">By student</h2>{summary.perStudent.length ? <a className={reviewLinkClass} href={`/professor/analytics/export?${exportQuery}`} download>Download CSV</a> : null}</div>
              {summary.perStudent.length === 0 ? <p className={`${reviewPanelTextClass} px-[18px] pt-3.5`}>No students have joined this workspace yet.</p> : <div className="overflow-x-auto"><table className={tableClass}>
                <thead><tr><th scope="col">Student</th><th scope="col">Submitted</th><th scope="col">Late</th><th scope="col">Missing</th><th scope="col">Avg score</th><th scope="col">Agreement</th></tr></thead>
                <tbody>{summary.perStudent.map(row => <tr key={row.id}>
                  <th scope="row" className="font-normal! text-(--text-primary)!">{row.name}</th>
                  <td>{row.submitted}/{row.total}</td><td>{row.late}</td><td>{row.missing}</td><td>{show(row.averageScore)}</td><td>{show(row.agreement, "%")}</td>
                </tr>)}</tbody>
              </table></div>}
            </section>
          </> : null}
        </>}
    </PageMain>
  </ProfessorShell>;
}
