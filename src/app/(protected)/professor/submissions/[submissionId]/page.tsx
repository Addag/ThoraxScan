import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { FacultyEvaluationForm } from "@/components/professor/faculty-evaluation-form";
import { XrayCasePreview } from "@/components/activities/activity-ui";
import { requireRole } from "@/lib/auth/server";
import { getProfessorSubmission } from "@/lib/evaluations/server";
import { saveFacultyEvaluationAction, releaseFacultyEvaluationAction } from "../actions";
import { getProfessorActivityAIHeatmap } from "@/lib/activity-ai/server";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { PageHeading, PageMain } from "@/components/dashboard-ui";

import { reviewAvatarClass, reviewCardClass, reviewCardTitleClass, reviewLinkClass, reviewSurfaceClass } from "@/components/professor/review-styles";

export const metadata = { title: "Student Review | ThoraxScan" };
export default async function SubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
  await requireRole("professor");
  const { submissionId } = await params;
  const submission = await getProfessorSubmission(submissionId);
  if (!submission) notFound();
  const { activity } = submission;
  const ai = activity.aiStatus;
  const attention = await getProfessorActivityAIHeatmap(activity.id);
  return <ProfessorShell activeItem="submissions" sectionLabel="Student Reviews" sectionDescription={activity.workspaceName}>
    <PageMain>
      <PageHeading title="Student Reviews" subtitle="Compare student evaluations with AI output and professor reference" back={{ href: "/professor/submissions", label: "Back to student reviews" }} />
      <section className={`mb-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 ${reviewSurfaceClass} border-(--border-shell) px-[22px] py-[17px] max-[600px]:grid-cols-[auto_minmax(0,1fr)]`} aria-labelledby="review-student-heading">
        <span className={reviewAvatarClass("large")} aria-hidden="true">{(submission.profiles?.display_name ?? "S").slice(0, 1).toUpperCase()}</span>
        <div><h2 className="m-0 text-title" id="review-student-heading">{submission.profiles?.display_name ?? "Student"}</h2><p className="mx-0 mt-0.5 mb-0 text-caption text-(--text-secondary)">{activity.title}</p><p className="mx-0 mt-0.5 mb-0 text-caption text-(--text-secondary)">Submitted <time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleString()}</time></p></div>
        <Link className={`${reviewLinkClass} max-[600px]:col-start-2`} href={`/professor/activities/${activity.id}`}>View activity</Link>
      </section>
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(310px,.75fr)] items-start gap-6 max-[900px]:grid-cols-1">
        <div className="grid gap-6">
          <div className="grid gap-3.5"><XrayCasePreview imageUrl={activity.imageUrl} imageError={activity.imageError} title={activity.title} /><AttentionHeatmap className={`${reviewSurfaceClass} border-(--border-shell) p-4`} imageUrl={activity.imageUrl} attention={attention} title={attention.status === "ready" && attention.kind === "per-label" ? "Finding heatmap" : "Relative global attention"} /></div>
          <div className={`${reviewSurfaceClass} border-(--border-shell) [&_h2]:mb-3.5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:text-lead [&_h2]:font-extrabold`}><FacultyEvaluationForm key={submission.faculty_evaluations?.updated_at ?? submission.id} evaluation={submission.faculty_evaluations}
            saveAction={saveFacultyEvaluationAction.bind(null, submissionId)} releaseAction={releaseFacultyEvaluationAction.bind(null, submissionId)} />
          </div>
        </div>
        <div className="grid gap-3.5">
          <section className={`${reviewCardClass} text-(--text-primary)`}><h2 className={reviewCardTitleClass}><span className="text-(--status-accent-text)" aria-hidden="true">▣</span> Student evaluation</h2><dl className="m-0 grid grid-cols-[minmax(120px,.35fr)_minmax(0,1fr)] gap-x-4 gap-y-[9px]">
            <dt className="text-label text-(--text-muted)">Student ID</dt><dd className="m-0 text-small">{submission.student_id}</dd>
            <dt className="text-label text-(--text-muted)">Visible findings</dt><dd className="m-0 whitespace-pre-wrap text-small leading-normal">{submission.visible_findings}</dd>
            <dt className="text-label text-(--text-muted)">Classification</dt><dd className="m-0 text-small">{submission.classification}</dd>
            <dt className="text-label text-(--text-muted)">Relevant region</dt><dd className="m-0 text-small">{submission.relevant_region || "Not applicable"}</dd>
          </dl></section>
          <section className={`${reviewCardClass} text-(--text-primary)`}><h2 className={reviewCardTitleClass}><span className="text-(--status-accent-text)" aria-hidden="true">▤</span> Reference evaluation</h2><p className="m-0 whitespace-pre-wrap text-caption leading-normal text-(--text-muted)">{activity.referenceEvaluation || "No reference available."}</p></section>
          <section className={`${reviewCardClass} text-(--text-primary)`}><h2 className={reviewCardTitleClass}>AI status and provenance</h2><dl className="m-0 grid grid-cols-[minmax(120px,.35fr)_minmax(0,1fr)] gap-x-4 gap-y-[9px]">
            <dt className="text-label text-(--text-muted)">Status</dt><dd className="m-0 text-small">{ai.status}</dd><dt className="text-label text-(--text-muted)">Attempts</dt><dd className="m-0 text-small">{ai.attemptCount}</dd>
            <dt className="text-label text-(--text-muted)">Model release</dt><dd className="m-0 text-small">{ai.releaseId ?? "Unavailable"}</dd>
            <dt className="text-label text-(--text-muted)">Manifest version</dt><dd className="m-0 text-small">{ai.manifestVersion ?? "Unavailable"}</dd>
            <dt className="text-label text-(--text-muted)">Preprocessing</dt><dd className="m-0 text-small">{ai.preprocessingVersion ?? "Unavailable"}</dd>
            <dt className="text-label text-(--text-muted)">Threshold version</dt><dd className="m-0 text-small">{ai.thresholdVersion ?? "Unavailable"}</dd>
            <dt className="text-label text-(--text-muted)">Execution provider</dt><dd className="m-0 text-small">{ai.executionProvider ?? "Unavailable"}</dd>
            <dt className="text-label text-(--text-muted)">Application build</dt><dd className="m-0 text-small">{ai.applicationBuild ?? "Unavailable"}</dd>
            <dt className="text-label text-(--text-muted)">Completed</dt><dd className="m-0 text-small">{ai.completedAt ?? "Not completed"}</dd>
          </dl></section>
        </div>
      </div>
    </PageMain>
  </ProfessorShell>;
}
