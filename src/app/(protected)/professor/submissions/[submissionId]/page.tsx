import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { FacultyEvaluationForm } from "@/components/professor/faculty-evaluation-form";
import { XrayCasePreview } from "@/components/activities/activity-ui";
import { requireRole } from "@/lib/auth/server";
import { getProfessorSubmission } from "@/lib/evaluations/server";
import { saveFacultyEvaluationAction, releaseFacultyEvaluationAction } from "../actions";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { LabelTags } from "@/components/professor/answer-key-form";
import { UNAVAILABLE_ATTENTION, readyClassActivation } from "@/lib/inference/attention";
import { finalGrade } from "@/lib/evaluations/types";
import { aiAccuracy, scoreLabels } from "@/lib/submissions/validation";
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
  const key = activity.validatedLabels ?? [];
  const match = scoreLabels(submission.selected_labels, key);
  const labelScore = submission.label_score === null ? null : Number(submission.label_score);
  const professorScore = submission.faculty_evaluations?.score ?? null;
  return <ProfessorShell activeItem="submissions" sectionLabel="Student Reviews" sectionDescription={activity.workspaceName}>
    <PageMain>
      <PageHeading title="Student Reviews" subtitle="Compare the student's labels with your validated answer key" back={{ href: "/professor/submissions", label: "Back to student reviews" }} />
      <section className={`mb-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 ${reviewSurfaceClass} border-(--border-shell) px-[22px] py-[17px] max-[600px]:grid-cols-[auto_minmax(0,1fr)]`} aria-labelledby="review-student-heading">
        <span className={reviewAvatarClass("large")} aria-hidden="true">{(submission.profiles?.display_name ?? "S").slice(0, 1).toUpperCase()}</span>
        <div><h2 className="m-0 text-title" id="review-student-heading">{submission.profiles?.display_name ?? "Student"}</h2><p className="mx-0 mt-0.5 mb-0 text-caption text-(--text-secondary)">{activity.title}</p><p className="mx-0 mt-0.5 mb-0 text-caption text-(--text-secondary)">Submitted <time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleString()}</time></p></div>
        <Link className={`${reviewLinkClass} max-[600px]:col-start-2`} href={`/professor/activities/${activity.id}`}>View activity</Link>
      </section>
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(310px,.75fr)] items-start gap-6 max-[900px]:grid-cols-1">
        <div className="grid gap-6">
          <div className="grid gap-3.5"><XrayCasePreview imageUrl={activity.imageUrl} imageError={activity.imageError} title={activity.title} /><AttentionHeatmap className={`${reviewSurfaceClass} border-(--border-shell) p-4`} imageUrl={activity.imageUrl} attention={activity.validatedHeatmap ? readyClassActivation(activity.validatedHeatmap) : UNAVAILABLE_ATTENTION} findings={key} title="Validated heatmap" /></div>
          <div className={`${reviewSurfaceClass} border-(--border-shell) [&_h2]:mb-3.5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:text-lead [&_h2]:font-extrabold`}><FacultyEvaluationForm key={submission.faculty_evaluations?.updated_at ?? submission.id} evaluation={submission.faculty_evaluations}
            saveAction={saveFacultyEvaluationAction.bind(null, submissionId)} releaseAction={releaseFacultyEvaluationAction.bind(null, submissionId)} />
          </div>
        </div>
        <div className="grid gap-3.5">
          <section className={`${reviewCardClass} text-(--text-primary)`}><h2 className={reviewCardTitleClass}><span className="text-(--status-accent-text)" aria-hidden="true">▣</span> Student evaluation</h2><dl className="m-0 grid grid-cols-[minmax(120px,.35fr)_minmax(0,1fr)] gap-x-4 gap-y-[9px]">
            <dt className="text-label text-(--text-muted)">Student ID</dt><dd className="m-0 text-small">{submission.student_id}</dd>
            <dt className="text-label text-(--text-muted)">Selected labels</dt><dd className="m-0 text-small leading-normal">{submission.selected_labels.join(", ") || "None recorded"}</dd>
            <dt className="text-label text-(--text-muted)">Correct</dt><dd className="m-0 text-small leading-normal">{match.correct.join(", ") || "None"}</dd>
            <dt className="text-label text-(--text-muted)">Missed</dt><dd className="m-0 text-small leading-normal">{match.missed.join(", ") || "None"}</dd>
            <dt className="text-label text-(--text-muted)">Wrong extras</dt><dd className="m-0 text-small leading-normal">{match.extra.join(", ") || "None"}</dd>
            <dt className="text-label text-(--text-muted)">Label score</dt><dd className="m-0 text-small">{labelScore === null ? "Not scored" : `${labelScore.toFixed(2)}%`}</dd>
            <dt className="text-label text-(--text-muted)">Final grade</dt><dd className="m-0 text-small">{professorScore === null ? "Set when you enter your grade (half label score, half your grade)" : `${finalGrade(labelScore, Number(professorScore)).toFixed(2)}%`}</dd>
          </dl></section>
          <section className={`${reviewCardClass} text-(--text-primary)`}><h2 className={reviewCardTitleClass}><span className="text-(--status-accent-text)" aria-hidden="true">▤</span> Answer key</h2>
            {key.length ? <><LabelTags labels={key} aiFindings={activity.aiFindings ?? []} />{activity.aiFindings ? <p className="mx-0 mt-3 mb-0 text-caption leading-normal text-(--text-muted)">AI matched {aiAccuracy(activity.aiFindings, key)} of the validated labels.</p> : null}</> : <p className="m-0 text-caption leading-normal text-(--text-muted)">No answer key was validated for this activity.</p>}
            {activity.referenceEvaluation ? <p className="mx-0 mt-3 mb-0 whitespace-pre-wrap text-caption leading-normal text-(--text-muted)">{activity.referenceEvaluation}</p> : null}
          </section>
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
