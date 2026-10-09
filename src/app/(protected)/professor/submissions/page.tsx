import Link from "next/link";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";
import { getProfessorSubmissions } from "@/lib/evaluations/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { getProfessorActivities } from "@/lib/activities/server";
import type { ReviewStatus } from "@/lib/evaluations/types";
import { PageHeading, PageMain, glassPanelClass } from "@/components/dashboard-ui";

export const metadata = { title: "Student Reviews | ThoraxScan" };
export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await requireRole("professor");
  const params = await searchParams;
  const workspaceId = typeof params.workspace === "string" ? params.workspace : "";
  const activityId = typeof params.activity === "string" ? params.activity : "";
  const status = ["unreviewed", "draft", "released"].includes(String(params.status)) ? params.status as ReviewStatus : undefined;
  const [submissions, workspaces, activities] = await Promise.all([
    getProfessorSubmissions({ workspaceId, activityId, status }), getProfessorWorkspaces(profile.id), getProfessorActivities(),
  ]);
  return <ProfessorShell activeItem="submissions" sectionLabel="Student Reviews" sectionDescription="Compare student evaluations with AI output and professor reference">
    <PageMain>
      <PageHeading title="Student Reviews" subtitle="Compare student evaluations with AI output and professor reference" />
      <section className={`${glassPanelClass} review-filter-panel`} aria-labelledby="review-filters-heading">
        <div className="review-panel-heading"><div><h2 id="review-filters-heading">Filters</h2><p>Select a submission to view its response and attention map.</p></div></div>
        <form className="evaluation-filters" method="get">
          <label>Workspace<select name="workspace" defaultValue={workspaceId}><option value="">All workspaces</option>{workspaces.data.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
          <label>Activity<select name="activity" defaultValue={activityId}><option value="">All activities</option>{activities.data.map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label>
          <label>Review status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="unreviewed">Unreviewed</option><option value="draft">Draft</option><option value="released">Released</option></select></label>
          <div className="review-filter-actions"><button type="submit">Apply filters</button><Link href="/professor/submissions">Clear filters</Link></div>
        </form>
      </section>
      {submissions.error || workspaces.error || activities.error ? <p role="alert">{submissions.error ?? "Some filter options could not be loaded. Please reload."}</p> : null}
      <section className={`${glassPanelClass} review-list-panel`} aria-labelledby="student-list-heading">
        <div className="review-panel-heading"><div><h2 id="student-list-heading">List of Students</h2><p>Click a student to see their progress.</p></div><span className="review-panel-icon" aria-hidden="true">?</span></div>
        {!submissions.error && submissions.data.length === 0 ? <p className="review-empty">No final submissions match these filters.</p> : null}
        <ul className="evaluation-queue">{submissions.data.map(submission => <li key={submission.id}>
          <Link className="review-queue-link" href={`/professor/submissions/${submission.id}`}>
            <span className="review-avatar" aria-hidden="true">{(submission.profiles?.display_name ?? "S").slice(0, 1).toUpperCase()}</span>
            <span className="review-queue-copy"><strong>{submission.profiles?.display_name ?? "Student"}</strong><span>{submission.activities.title}</span><small>{submission.activities.workspaces.name} · <time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleString()}</time></small></span>
            <span className={`evaluation-status evaluation-status--${submission.faculty_evaluations?.status ?? "unreviewed"}`}>{submission.faculty_evaluations?.status ?? "unreviewed"}</span>
          </Link>
        </li>)}</ul>
      </section>
    </PageMain>
  </ProfessorShell>;
}
