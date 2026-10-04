import Link from "next/link";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";
import { getProfessorSubmissions } from "@/lib/evaluations/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { getProfessorActivities } from "@/lib/activities/server";
import type { ReviewStatus } from "@/lib/evaluations/types";

export const metadata = { title: "Submissions | ThoraxScan" };
export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await requireRole("professor");
  const params = await searchParams;
  const workspaceId = typeof params.workspace === "string" ? params.workspace : "";
  const activityId = typeof params.activity === "string" ? params.activity : "";
  const status = ["unreviewed", "draft", "released"].includes(String(params.status)) ? params.status as ReviewStatus : undefined;
  const [submissions, workspaces, activities] = await Promise.all([
    getProfessorSubmissions({ workspaceId, activityId, status }), getProfessorWorkspaces(profile.id), getProfessorActivities(),
  ]);
  return <ProfessorShell activeItem="submissions" sectionLabel="Submissions" sectionDescription="Review final Student responses">
    <main className="student-dashboard">
      <h1>Submissions</h1><p>Final responses, newest first. Archived activities remain available for review.</p>
      <form className="evaluation-filters" method="get">
        <label>Workspace<select name="workspace" defaultValue={workspaceId}><option value="">All workspaces</option>{workspaces.data.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
        <label>Activity<select name="activity" defaultValue={activityId}><option value="">All activities</option>{activities.data.map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label>
        <label>Review status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="unreviewed">Unreviewed</option><option value="draft">Draft</option><option value="released">Released</option></select></label>
        <button type="submit">Apply filters</button><Link href="/professor/submissions">Clear filters</Link>
      </form>
      {submissions.error || workspaces.error || activities.error ? <p role="alert">{submissions.error ?? "Some filter options could not be loaded. Please reload."}</p> : null}
      {!submissions.error && submissions.data.length === 0 ? <p>No final submissions match these filters.</p> : null}
      <ul className="evaluation-queue">{submissions.data.map(submission => <li key={submission.id}>
        <div><Link href={`/professor/submissions/${submission.id}`}>{submission.profiles?.display_name ?? "Student"} · {submission.activities.title}</Link>
          <p>{submission.activities.workspaces.name} · <time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleString()}</time></p></div>
        <span className="evaluation-status">{submission.faculty_evaluations?.status ?? "unreviewed"}</span>
      </li>)}</ul>
    </main>
  </ProfessorShell>;
}
