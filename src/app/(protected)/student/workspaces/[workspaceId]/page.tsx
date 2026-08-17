import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";
import { getStudentWorkspace } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Workspace | ThoraxScan",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StudentWorkspacePage({
  params,
}: PageProps<"/student/workspaces/[workspaceId]">) {
  const profile = await requireRole("student");
  const { workspaceId } = await params;

  if (!uuidPattern.test(workspaceId)) notFound();

  const workspace = await getStudentWorkspace(profile.id, workspaceId);
  if (!workspace) notFound();

  return (
    <StudentShell>
      <main className="student-dashboard student-workspace-detail">
        <Link className="student-back-link" href="/student">← Back to dashboard</Link>
        <section className="student-detail-card">
          <p className="student-section-kicker">Student workspace</p>
          <h1>{workspace.name}</h1>
          <p className="student-detail-card__description">
            This workspace is your entry point for future chest X-ray learning activities.
          </p>
          <dl>
            <div><dt>Your access</dt><dd>Student · Read only</dd></div>
            <div>
              <dt>Joined</dt>
              <dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(workspace.joined_at))}</dd>
            </div>
          </dl>
        </section>
        <section className="student-future-panel">
          <span aria-hidden="true">◎</span>
          <div>
            <h2>Activities are coming next</h2>
            <p>Your professor’s activities and case assignments will appear here in a future milestone.</p>
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
