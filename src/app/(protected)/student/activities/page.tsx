import type { Metadata } from "next";
import Link from "next/link";

import {
  ActivityPageHeading,
  dueState,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { StudentShell } from "@/components/student/student-shell";
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
          <div className="activity-empty-state activity-empty-state--error" role="alert">
            <h2>Activities are unavailable</h2>
            <p>Refresh the page or try again later.</p>
          </div>
        ) : activities.data.length === 0 ? (
          <div className="activity-empty-state">
            <span aria-hidden="true">▣</span>
            <h2>No published activities yet</h2>
            <p>Activities will appear here as soon as teaching staff publish them.</p>
          </div>
        ) : (
          <div className="student-activity-list">
            {activities.data.map((activity) => (
              <article className="student-activity-card" key={activity.id}>
                <div className="student-activity-card__icon" aria-hidden="true">◉</div>
                <div>
                  <p>{activity.workspaceName}</p>
                  <h2>{activity.title}</h2>
                  <span className={`student-due-state student-due-state--${dueState(activity.dueAt).toLowerCase()}`}>
                    {dueState(activity.dueAt)} · {formatDueDate(activity.dueAt)}
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
