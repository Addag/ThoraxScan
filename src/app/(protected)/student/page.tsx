import { submissionLabel } from "@/lib/submissions/types";
import type { Metadata } from "next";
import Link from "next/link";

import { InvitationForm } from "@/components/student/invitation-form";
import { StudentShell } from "@/components/student/student-shell";
import { formatDueDate } from "@/components/activities/activity-ui";
import { getStudentActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getStudentWorkspaces } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Student workspace | ThoraxScan",
};

export default async function StudentPage() {
  const profile = await requireRole("student");
  const [workspaces, recentActivities] = await Promise.all([
    getStudentWorkspaces(profile.id),
    getStudentActivities(3),
  ]);

  return (
    <StudentShell>
      <main className="student-dashboard">
        <div className="student-page-heading">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {profile.display_name}!</p>
          </div>
          <time dateTime={new Date().toISOString().slice(0, 10)}>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(new Date())}
          </time>
        </div>

        <section className="student-join-panel" aria-labelledby="join-workspace-title">
          <div>
            <p className="student-section-kicker">Workspace access</p>
            <h2 id="join-workspace-title">Join your class workspace</h2>
          </div>
          <InvitationForm />
        </section>

        <section className="student-workspaces" aria-labelledby="joined-workspaces-title">
          <div className="student-section-heading">
            <div>
              <p className="student-section-kicker">Learning spaces</p>
              <h2 id="joined-workspaces-title">Joined workspaces</h2>
            </div>
            <span>{workspaces.data.length} joined</span>
          </div>

          {workspaces.error ? (
            <div className="student-empty-state student-empty-state--error" role="alert">
              <h3>Workspaces are unavailable</h3>
              <p>Refresh the page or try again later.</p>
            </div>
          ) : workspaces.data.length === 0 ? (
            <div className="student-empty-state">
              <span aria-hidden="true">＋</span>
              <h3>No workspaces yet</h3>
              <p>Use a Student invitation code to join your first workspace.</p>
            </div>
          ) : (
            <div className="student-workspace-grid">
              {workspaces.data.map((workspace) => (
                <article className="student-workspace-card" key={workspace.id}>
                  <div className="student-workspace-card__icon" aria-hidden="true">W</div>
                  <p>Student workspace</p>
                  <h3>{workspace.name}</h3>
                  <span>
                    Joined {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(workspace.joined_at))}
                  </span>
                  <Link href={`/student/workspaces/${workspace.id}`}>
                    Open workspace <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="student-recent-activities" aria-labelledby="recent-activities-title">
          <div className="student-section-heading">
            <div>
              <p className="student-section-kicker">Published assignments</p>
              <h2 id="recent-activities-title">Recent activities</h2>
            </div>
            <Link href="/student/activities">View all</Link>
          </div>
          {recentActivities.error ? (
            <p className="professor-list-empty">Recent activities are unavailable.</p>
          ) : recentActivities.data.length === 0 ? (
            <p className="professor-list-empty">No activities have been published to your workspaces yet.</p>
          ) : (
            <div className="student-recent-activity-grid">
              {recentActivities.data.map((activity) => (
                <Link href={`/student/activities/${activity.id}`} key={activity.id}>
                  <span>{activity.workspaceName}</span>
                  <strong>{activity.title}</strong>
                  <small>{submissionLabel(activity.submissionStatus, activity.dueAt)} · {activity.aiStatus === "ready" ? "Feedback available" : activity.aiStatus === "pending" ? "Analysis pending" : activity.aiStatus === "failed" ? "Analysis failed" : "AI feedback locked"} · {formatDueDate(activity.dueAt)}</small>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="student-privacy-note">
          <strong>Privacy notice</strong>
          <p>Published case images use private storage and short-lived signed access.</p>
        </aside>
      </main>
    </StudentShell>
  );
}
