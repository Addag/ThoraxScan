import { submissionLabel } from "@/lib/submissions/types";
import type { Metadata } from "next";
import Link from "next/link";

import { InvitationForm } from "@/components/student/invitation-form";
import { StudentShell } from "@/components/student/student-shell";
import { formatDueDate } from "@/components/activities/activity-ui";
import { EmptyState } from "@/components/empty-state";
import { PageHeading, SectionHeading, WorkspaceCard, countBadgeClass, listEmptyClass, sectionKickerClass , PageMain} from "@/components/dashboard-ui";
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
      <PageMain>
        <PageHeading title="Home" subtitle={`Welcome back, ${profile.display_name}!`} />

        <section className="rounded-panel border border-(--border-shell) [background:var(--glass-surface)] shadow-(--glass-shadow) p-6 max-[600px]:p-5" aria-labelledby="recent-activities-title">
          <SectionHeading kicker="Published assignments" title="Recent activities" titleId="recent-activities-title" aside={<Link className="transition-colors duration-160 hover:text-(--text-primary) text-caption font-extrabold text-(--brand-blue-text) no-underline" href="/student/activities">View all</Link>} />
          {recentActivities.error ? (
            <p className={listEmptyClass}>Recent activities are unavailable.</p>
          ) : recentActivities.data.length === 0 ? (
            <p className={listEmptyClass}>No activities have been published to your workspaces yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3.5 pt-[18px] max-[760px]:grid-cols-1">
              {recentActivities.data.map((activity) => (
                <Link className="transition-colors duration-160 hover:bg-(--hover-overlay) flex min-h-[130px] flex-col justify-between rounded-panel border border-(--border-shell) bg-(--glass-inset) p-4 no-underline shadow-(--glass-inset-shadow)" href={`/student/activities/${activity.id}`} key={activity.id}>
                  <span className="text-label font-extrabold uppercase tracking-[0.08em] text-(--brand-blue-text)">{activity.workspaceName}</span>
                  <strong className="mt-2 text-lead leading-tight text-(--text-primary)">{activity.title}</strong>
                  <small className="mt-3 text-label leading-snug text-(--text-muted)">{submissionLabel(activity.submissionStatus, activity.dueAt)} · {activity.aiStatus === "ready" ? "Feedback available" : activity.aiStatus === "pending" ? "Analysis pending" : activity.aiStatus === "failed" ? "Analysis failed" : "AI feedback locked"} · {formatDueDate(activity.dueAt)}</small>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 grid grid-cols-[minmax(210px,0.75fr)_minmax(320px,1.25fr)] items-center gap-9 rounded-panel border border-(--border-shell) [background:var(--glass-surface)] p-6 backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) max-[850px]:grid-cols-1 max-[850px]:gap-5" aria-labelledby="join-workspace-title">
          <div>
            <p className={sectionKickerClass}>Workspace access</p>
            <h2 className="m-0 text-title" id="join-workspace-title">Join your class workspace</h2>
          </div>
          <InvitationForm />
        </section>

        <section className="mt-6 rounded-panel border border-(--border-shell) [background:var(--glass-surface)] p-6 backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) max-[600px]:p-5" aria-labelledby="joined-workspaces-title">
          <SectionHeading kicker="Learning spaces" title="Joined workspaces" titleId="joined-workspaces-title" aside={<span className={countBadgeClass}>{workspaces.data.length} joined</span>} />

          {workspaces.error ? (
            <EmptyState error role="alert" title="Workspaces are unavailable">Refresh the page or try again later.</EmptyState>
          ) : workspaces.data.length === 0 ? (
            <EmptyState icon="＋" title="No workspaces yet">Use a Student invitation code to join your first workspace.</EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-[18px] pt-[22px] max-[600px]:grid-cols-1">
              {workspaces.data.map((workspace) => (
                <WorkspaceCard key={workspace.id} role="Student workspace" name={workspace.name} detail={`Joined ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(workspace.joined_at))}`} href={`/student/workspaces/${workspace.id}`} linkLabel="Open workspace" />
              ))}
            </div>
          )}
        </section>

        <aside className="mt-6 flex items-baseline gap-4 rounded-panel border border-(--brand-blue) bg-[rgba(0,119,255,0.18)] px-6 py-4 leading-snug max-[600px]:flex-col max-[600px]:items-start">
          <strong className="shrink-0 text-body uppercase tracking-[0.08em] font-extrabold">Privacy notice</strong>
          <p className="m-0 text-caption text-(--brand-blue-text)">Published case images use private storage and short-lived signed access.</p>
        </aside>
      </PageMain>
    </StudentShell>
  );
}
