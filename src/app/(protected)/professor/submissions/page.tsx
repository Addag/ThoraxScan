import { field } from "@/components/controls";
import Link from "next/link";
import { FilterForm } from "@/components/filter-form";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";
import { getProfessorSubmissions } from "@/lib/evaluations/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { getProfessorActivities } from "@/lib/activities/server";
import type { ReviewStatus } from "@/lib/evaluations/types";
import { PageHeading, PageMain, glassPanelClass } from "@/components/dashboard-ui";

import { evaluationStatusClass, reviewAvatarClass, reviewFieldLabelClass, reviewHeadingClass, reviewLinkClass } from "@/components/professor/review-styles";

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
  return <ProfessorShell activeItem="submissions" sectionLabel="Student Reviews" sectionDescription="Grade final submissions">
    <PageMain>
      <PageHeading title="Student Reviews" subtitle="Compare student evaluations with AI output and professor reference" />
      <section className={`${glassPanelClass} border-(--border-shell) mb-6 overflow-hidden p-0`} aria-labelledby="review-filters-heading">
        <div className="flex min-h-[58px] items-center justify-between gap-4 border-b border-b-(--border-subtle) px-[18px] py-[11px]"><div><h2 className={reviewHeadingClass} id="review-filters-heading">Filters</h2><p className="mx-0 mt-0.5 mb-0 text-caption text-(--text-secondary)">Select a submission to view its response and attention map.</p></div></div>
        <FilterForm className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-3 px-[18px] pt-3.5 pb-[17px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          <label className={reviewFieldLabelClass}>Workspace<select className={field} name="workspace" defaultValue={workspaceId}><option value="">All workspaces</option>{workspaces.data.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
          <label className={reviewFieldLabelClass}>Activity<select className={field} name="activity" defaultValue={activityId}><option value="">All activities</option>{activities.data.map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label>
          <label className={reviewFieldLabelClass}>Review status<select className={field} name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="unreviewed">Unreviewed</option><option value="draft">Draft</option><option value="released">Released</option></select></label>
          <div className="flex items-end gap-2.5 max-[900px]:col-span-full max-[900px]:items-center"><Link className={reviewLinkClass} href="/professor/submissions">Clear filters</Link></div>
        </FilterForm>
      </section>
      {submissions.error || workspaces.error || activities.error ? <p role="alert">{submissions.error ?? "Some filter options could not be loaded. Please reload."}</p> : null}
      <section className={`${glassPanelClass} border-(--border-shell) mb-6 overflow-hidden p-0`} aria-labelledby="student-list-heading">
        <div className="flex min-h-[58px] items-center justify-between gap-4 border-b border-b-(--border-subtle) px-[18px] py-[11px]"><div><h2 className={reviewHeadingClass} id="student-list-heading">Submissions</h2><p className="mx-0 mt-0.5 mb-0 text-caption text-(--text-secondary)">Open a submission to review it.</p></div></div>
        {!submissions.error && submissions.data.length === 0 ? <p className="m-0 px-[18px] py-7 text-small text-(--text-muted)">No final submissions match these filters.</p> : null}
        <ul className="m-0 grid list-none gap-px p-0">{submissions.data.map(submission => <li key={submission.id}>
          <Link className="grid min-h-[70px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-[13px] bg-[rgb(3_9_25/30%)] px-[18px] py-3 text-(--text-primary) no-underline hover:bg-[rgb(8_127_255/14%)] focus-visible:bg-[rgb(8_127_255/14%)] max-[600px]:grid-cols-[40px_minmax(0,1fr)]" href={`/professor/submissions/${submission.id}`}>
            <span className={reviewAvatarClass()} aria-hidden="true">{(submission.profiles?.display_name ?? "S").slice(0, 1).toUpperCase()}</span>
            <span className="grid min-w-0 gap-0.5"><strong className="truncate text-body">{submission.profiles?.display_name ?? "Student"}</strong><span className="truncate text-caption">{submission.activities.title}</span><small className="truncate text-label text-(--text-muted)">{submission.activities.workspaces.name} · <time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleString()}</time></small></span>
            <span className={`${evaluationStatusClass(submission.faculty_evaluations?.status ?? "unreviewed")} max-[600px]:col-start-2 max-[600px]:justify-self-start`}>{submission.faculty_evaluations?.status ?? "unreviewed"}</span>
          </Link>
        </li>)}</ul>
      </section>
    </PageMain>
  </ProfessorShell>;
}
