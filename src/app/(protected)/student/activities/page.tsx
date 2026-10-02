import { submissionLabel } from "@/lib/submissions/types";
import type { Metadata } from "next";
import Link from "next/link";

import {
  ActivityPageHeading,
  dueState,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { StudentShell } from "@/components/student/student-shell";
import { EmptyState } from "@/components/empty-state";
import { getStudentActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Activities | ThoraxScan",
};

export default async function StudentActivitiesPage() {
  await requireRole("student");
  const activities = await getStudentActivities();

  return (
    <StudentShell activeItem="activities" sectionLabel="Activities" sectionDescription="Published class activities">
      <main className="student-dashboard activity-dashboard">
        <ActivityPageHeading description="Review published chest X-ray assignments from your workspaces" />

        {activities.error ? (
          <EmptyState variant="card" error role="alert" title="Activities are unavailable">Refresh the page or try again later.</EmptyState>
        ) : activities.data.length === 0 ? (
          <EmptyState variant="card" icon="▣" title="No published activities yet">Activities will appear here as soon as teaching staff publish them.</EmptyState>
        ) : (
          <div className="student-activity-list">
            {activities.data.map((activity) => (
              <article className="student-activity-card" key={activity.id}>
                <div className="student-activity-card__icon" aria-hidden="true">◉</div>
                <div>
                  <p>{activity.workspaceName}</p>
                  <h2>{activity.title}</h2>
                  <span className={`student-due-state student-due-state--${dueState(activity.dueAt).toLowerCase()}`}>
                    {submissionLabel(activity.submissionStatus, activity.dueAt)} · {activity.aiStatus === "ready" ? "Feedback available" : activity.aiStatus === "pending" ? "Analysis pending" : activity.aiStatus === "failed" ? "Analysis failed · retry available" : "AI feedback locked"} · {formatDueDate(activity.dueAt)}
                  </span>
                </div>
                <Link href={`/student/activities/${activity.id}`}>Review activity <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </StudentShell>
  );
}
