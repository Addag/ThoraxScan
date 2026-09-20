import { saveStudentSubmission } from "../actions";
import { getStudentActivityFacultyEvaluation } from "@/lib/evaluations/server";
import { StudentFacultyEvaluationPanel } from "@/components/activities/student-faculty-evaluation";
import { StudentSubmissionForm } from "@/components/activities/student-submission-form";
import { submissionLabel } from "@/lib/submissions/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ActivityPageHeading,
  ActivityStepRail,
  XrayCasePreview,
  dueState,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { StudentShell } from "@/components/student/student-shell";
import { getStudentActivity } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getOwnAccountSettings } from "@/lib/settings/server";
import { ActivityAIFeedback } from "@/components/activities/activity-ai-feedback";

export const metadata: Metadata = {
  title: "Activity | ThoraxScan",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StudentActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const profile = await requireRole("student");
  const { activityId } = await params;
  if (!uuidPattern.test(activityId)) notFound();

  const [activity, accountSettings, facultyEvaluation] = await Promise.all([
    getStudentActivity(activityId),
    getOwnAccountSettings(profile.id),
    getStudentActivityFacultyEvaluation(activityId),
  ]);
  if (!activity) notFound();

  return (
    <StudentShell activeItem="activities" sectionLabel="Activities" sectionDescription={activity.workspaceName}>
      <main className="student-dashboard activity-dashboard student-activity-detail">
        <ActivityPageHeading
          title={activity.title}
          description={`${activity.workspaceName} · ${formatDueDate(activity.dueAt)}`}
          backHref="/student/activities"
        />
        <ActivityStepRail role="student" submissionStatus={submissionLabel(activity.submissionStatus, activity.dueAt)} aiStatus={activity.aiFeedback.status} />

        <section className="student-assignment-panel" aria-labelledby="assignment-title">
          <div className="activity-panel-title">
            <span aria-hidden="true">▤</span>
            <h2 id="assignment-title">Activity Assignment</h2>
          </div>
          <div className="student-assignment-copy">
            <p>{activity.instructions}</p>
            <dl>
              <div><dt>Workspace</dt><dd>{activity.workspaceName}</dd></div>
              <div><dt>Due status</dt><dd>{dueState(activity.dueAt)} · {formatDueDate(activity.dueAt)}</dd></div>
            </dl>
          </div>
        </section>

        <div className="student-activity-workspace">
          <div className="activity-case-column">
            <XrayCasePreview
              imageUrl={activity.imageUrl}
              imageError={activity.imageError}
              title={activity.title}
              darkImageBackground={accountSettings.settings.darkImageBackground}
            />
            <ActivityAIFeedback activityId={activity.id} imageUrl={activity.imageUrl} initial={activity.aiFeedback} />
          </div>
          <StudentSubmissionForm
            submission={activity.submission}
            dueAt={activity.dueAt}
            deadlinePassed={submissionLabel(null, activity.dueAt) === "Deadline passed"}
            action={saveStudentSubmission.bind(null, activityId)}
          />
        </div>
        <StudentFacultyEvaluationPanel evaluation={facultyEvaluation.data} error={facultyEvaluation.error} />
      </main>
    </StudentShell>
  );
}
