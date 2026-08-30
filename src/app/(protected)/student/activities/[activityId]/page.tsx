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

  const [activity, accountSettings] = await Promise.all([
    getStudentActivity(activityId),
    getOwnAccountSettings(profile.id),
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
        <ActivityStepRail role="student" />

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
            <aside className="activity-future-panel">
              <span aria-hidden="true">➤</span>
              <div><strong>Evaluation guide</strong><small>Submissions are not enabled in this milestone</small></div>
            </aside>
          </div>
          <section className="student-evaluation-panel">
            <div className="activity-form-heading">
              <span aria-hidden="true">➤</span>
              <div><p>Future functionality</p><h2>Your Evaluation</h2></div>
            </div>
            <label>
              What visible findings do you observe?
              <textarea rows={4} disabled placeholder="Student responses are coming in a future milestone." />
            </label>
            <label>
              Normal or abnormal?
              <input disabled />
            </label>
            <label>
              Which region appears most relevant?
              <input disabled />
            </label>
            <button className="activity-primary-button" type="button" disabled>Submit evaluation · Coming soon</button>
          </section>
        </div>
      </main>
    </StudentShell>
  );
}
