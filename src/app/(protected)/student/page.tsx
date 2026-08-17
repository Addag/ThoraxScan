import type { Metadata } from "next";
import Link from "next/link";

import { InvitationForm } from "@/components/student/invitation-form";
import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";
import { getStudentWorkspaces } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Student workspace | ThoraxScan",
};

export default async function StudentPage() {
  const profile = await requireRole("student");
  const workspaces = await getStudentWorkspaces(profile.id);

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

        <aside className="student-privacy-note">
          <strong>Privacy notice</strong>
          <p>Future X-ray learning activities will process images locally in your browser.</p>
        </aside>
      </main>
    </StudentShell>
  );
}
