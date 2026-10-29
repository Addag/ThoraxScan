import { saveStudentSubmission } from "../actions";
import { getStudentActivityFacultyEvaluation } from "@/lib/evaluations/server";
import { StudentFacultyEvaluationPanel } from "@/components/activities/student-faculty-evaluation";
import { StudentSubmissionForm } from "@/components/activities/student-submission-form";
import { submissionLabel } from "@/lib/submissions/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ActivityStepRail,
  XrayCasePreview,
  dueState,
  formatDueDate,
  ActivityPanelTitle, activityLayoutClass, activityCaseColumnClass,
} from "@/components/activities/activity-ui";
import { StudentShell } from "@/components/student/student-shell";
import { getStudentActivity } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { ActivityAIFeedback } from "@/components/activities/activity-ai-feedback";
import { PageHeading, PageMain } from "@/components/dashboard-ui";

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
  await requireRole("student");
  const { activityId } = await params;
  if (!uuidPattern.test(activityId)) notFound();

  const [activity, facultyEvaluation] = await Promise.all([
    getStudentActivity(activityId),
    getStudentActivityFacultyEvaluation(activityId),
  ]);
  if (!activity) notFound();

  return (
    <StudentShell activeItem="activities" sectionLabel="Activities" sectionDescription={activity.workspaceName}>
      <PageMain>
        <PageHeading
          title={activity.title}
          subtitle={`${activity.workspaceName} · ${formatDueDate(activity.dueAt)}`}
          back={{ href: "/student/activities", label: "Back to activities" }}
        />
        <ActivityStepRail role="student" submissionStatus={submissionLabel(activity.submissionStatus, activity.dueAt)} aiStatus={activity.aiFeedback.status} />

        <section className="rounded-panel border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) mb-6 pb-6" aria-labelledby="assignment-title">
          <ActivityPanelTitle icon="▤" title="Activity Assignment" titleId="assignment-title" />
          <div className="mx-[25px] mt-[22px] mb-0 rounded-panel border border-brand bg-[rgba(0,119,255,0.24)] p-4 [&>p]:m-0 [&>p]:whitespace-pre-wrap [&>p]:leading-[1.55] [&_dl]:mx-0 [&_dl]:mt-[18px] [&_dl]:mb-0 [&_dl]:grid [&_dl]:grid-cols-2 [&_dl]:gap-3 max-[520px]:[&_dl]:grid-cols-1 [&_dl_div]:rounded-control [&_dl_div]:bg-[rgba(0,0,0,0.18)] [&_dl_div]:p-2.5 [&_dt]:text-[0.6875rem] [&_dt]:uppercase [&_dt]:text-(--brand-blue-text) [&_dd]:mx-0 [&_dd]:mt-1 [&_dd]:mb-0 [&_dd]:text-[0.6875rem]">
            <p>{activity.instructions}</p>
            <dl>
              <div><dt>Workspace</dt><dd>{activity.workspaceName}</dd></div>
              <div><dt>Due status</dt><dd>{dueState(activity.dueAt)} · {formatDueDate(activity.dueAt)}</dd></div>
            </dl>
          </div>
        </section>

        <div className={activityLayoutClass("default")}>
          <div className={activityCaseColumnClass}>
            <XrayCasePreview
              imageUrl={activity.imageUrl}
              imageError={activity.imageError}
              title={activity.title}
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
      </PageMain>
    </StudentShell>
  );
}
