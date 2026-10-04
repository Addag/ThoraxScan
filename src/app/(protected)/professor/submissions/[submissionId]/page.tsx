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
import { PageMain } from "@/components/dashboard-ui";

export const metadata = { title: "Review submission | ThoraxScan" };
export default async function SubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
  await requireRole("professor");
  const { submissionId } = await params;
  const submission = await getProfessorSubmission(submissionId);
  if (!submission) notFound();
  const { activity } = submission;
  const ai = activity.aiStatus;
  const attention = await getProfessorActivityAIHeatmap(activity.id);
  return <ProfessorShell activeItem="submissions" sectionLabel="Review submission" sectionDescription={activity.workspaceName}>
    <PageMain>
      <Link href="/professor/submissions">← Back to submissions</Link>
      <h1>{submission.profiles?.display_name ?? "Student"} · {activity.title}</h1>
      <p>Submitted <time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleString()}</time> · {activity.status}</p>
      <Link href={`/professor/activities/${activity.id}`}>View activity</Link>
      <div className="evaluation-detail-grid">
        <div>
          <section className="faculty-evaluation-panel"><h2>Student response</h2><dl>
            <dt>Student ID</dt><dd>{submission.student_id}</dd>
            <dt>Visible findings</dt><dd className="evaluation-text">{submission.visible_findings}</dd>
            <dt>Classification</dt><dd>{submission.classification}</dd>
            <dt>Relevant region</dt><dd>{submission.relevant_region || "Not applicable"}</dd>
          </dl></section>
          <XrayCasePreview imageUrl={activity.imageUrl} imageError={activity.imageError} title={activity.title} />
          <section className="faculty-evaluation-panel"><h2>Private reference evaluation</h2><p className="evaluation-text">{activity.referenceEvaluation || "No reference available."}</p></section>
          <AttentionHeatmap imageUrl={activity.imageUrl} attention={attention} title="Model attention" />
          <section className="faculty-evaluation-panel"><h2>AI status and provenance</h2><dl>
            <dt>Status</dt><dd>{ai.status}</dd><dt>Attempts</dt><dd>{ai.attemptCount}</dd>
            <dt>Model release</dt><dd>{ai.releaseId ?? "Unavailable"}</dd>
            <dt>Manifest version</dt><dd>{ai.manifestVersion ?? "Unavailable"}</dd>
            <dt>Preprocessing</dt><dd>{ai.preprocessingVersion ?? "Unavailable"}</dd>
            <dt>Threshold version</dt><dd>{ai.thresholdVersion ?? "Unavailable"}</dd>
            <dt>Execution provider</dt><dd>{ai.executionProvider ?? "Unavailable"}</dd>
            <dt>Application build</dt><dd>{ai.applicationBuild ?? "Unavailable"}</dd>
            <dt>Completed</dt><dd>{ai.completedAt ?? "Not completed"}</dd>
          </dl></section>
        </div>
        <FacultyEvaluationForm key={submission.faculty_evaluations?.updated_at ?? submission.id} evaluation={submission.faculty_evaluations}
          saveAction={saveFacultyEvaluationAction.bind(null, submissionId)} releaseAction={releaseFacultyEvaluationAction.bind(null, submissionId)} />
      </div>
    </PageMain>
  </ProfessorShell>;
}
