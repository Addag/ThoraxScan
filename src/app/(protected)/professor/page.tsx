import type { Metadata } from "next";
import Link from "next/link";

import {
  CreateWorkspaceForm,
  ProfessorRedeemForm,
} from "@/components/professor/professor-forms";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { EmptyState } from "@/components/empty-state";
import { getProfessorActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Professor workspace | ThoraxScan",
};

export default async function ProfessorPage() {
  const profile = await requireRole("professor");
  const [workspaces, activities] = await Promise.all([
    getProfessorWorkspaces(profile.id),
    getProfessorActivities(),
  ]);
  const ownedCount = workspaces.data.filter((workspace) => workspace.is_owner).length;
  const joinedCount = workspaces.data.length - ownedCount;

  return (
    <ProfessorShell>
      <main className="student-dashboard professor-dashboard">
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

        <section className="professor-stat-grid" aria-label="Workspace overview">
          <article>
            <span aria-hidden="true">W</span>
            <strong>{workspaces.data.length}</strong>
            <p>Total workspaces</p>
            <small>Owned and joined</small>
          </article>
          <article>
            <span aria-hidden="true">★</span>
            <strong>{ownedCount}</strong>
            <p>Owned workspaces</p>
            <small>Full management access</small>
          </article>
          <article>
            <span aria-hidden="true">◎</span>
            <strong>{joinedCount}</strong>
            <p>Co-professor roles</p>
            <small>Teaching access</small>
          </article>
          <article>
            <span aria-hidden="true">＋</span>
            <strong>{activities.data.length}</strong>
            <p>Activities</p>
            <small>{activities.data.filter((activity) => activity.status === "published").length} published · {activities.data.filter((activity) => activity.status === "draft").length} drafts</small>
          </article>
        </section>

        <Link className="professor-activities-cta" href="/professor/activities">
          <span><strong>Manage activities</strong><small>Author, publish, and archive case-backed assignments</small></span>
          <span aria-hidden="true">→</span>
        </Link>

        <section className="professor-dashboard-actions" aria-label="Workspace actions">
          <article>
            <p className="student-section-kicker">New class space</p>
            <h2>Create a workspace</h2>
            <CreateWorkspaceForm />
          </article>
          <article>
            <p className="student-section-kicker">Teaching access</p>
            <h2>Join as co-professor</h2>
            <ProfessorRedeemForm />
          </article>
        </section>

        <section className="student-workspaces professor-workspaces" aria-labelledby="professor-workspaces-title">
          <div className="student-section-heading">
            <div>
              <p className="student-section-kicker">Class management</p>
              <h2 id="professor-workspaces-title">Teaching workspaces</h2>
            </div>
            <span>{workspaces.data.length} total</span>
          </div>

          {workspaces.error ? (
            <EmptyState error role="alert" title="Workspaces are unavailable">Refresh the page or try again later.</EmptyState>
          ) : workspaces.data.length === 0 ? (
            <EmptyState icon="＋" title="No teaching workspaces yet">Create a workspace or redeem a Professor invitation.</EmptyState>
          ) : (
            <div className="student-workspace-grid">
              {workspaces.data.map((workspace) => (
                <article className="student-workspace-card professor-workspace-card" key={workspace.id}>
                  <div className="student-workspace-card__icon" aria-hidden="true">W</div>
                  <p>{workspace.is_owner ? "Owner" : "Co-professor"}</p>
                  <h3>{workspace.name}</h3>
                  <span>
                    {workspace.is_owner ? "Full management access" : "Student and roster access"}
                  </span>
                  <Link href={`/professor/workspaces/${workspace.id}`}>
                    Manage workspace <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </ProfessorShell>
  );
}
