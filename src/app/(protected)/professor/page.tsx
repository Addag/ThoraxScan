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
import { PageHeading, SectionHeading, StatCard, StatGrid, WorkspaceCard, countBadgeClass, sectionKickerClass , PageMain} from "@/components/dashboard-ui";
import { activitiesCtaClass } from "@/components/activities/activity-ui";

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
      <PageMain bottom="pb-[60px]">
        <PageHeading title="Home" subtitle={`Welcome back, ${profile.display_name}!`} />

        <StatGrid>
          <StatCard symbol="W" value={workspaces.data.length} label="Total workspaces" detail="Owned and joined" />
          <StatCard symbol="★" value={ownedCount} label="Owned workspaces" detail="Full management access" />
          <StatCard symbol="◎" value={joinedCount} label="Co-professor roles" detail="Teaching access" />
          <StatCard symbol="＋" value={activities.data.length} label="Activities" detail={`${activities.data.filter((activity) => activity.status === "published").length} published · ${activities.data.filter((activity) => activity.status === "draft").length} drafts`} />
        </StatGrid>

        <Link className={activitiesCtaClass} href="/professor/activities">
          <span className="grid gap-1"><strong>Manage activities</strong><small className="text-[0.6875rem] text-[#9fcfff] light:text-(--brand-blue-text)">Author, publish, and archive case-backed assignments</small></span>
          <span className="text-[1.5rem] text-[#70bdff] light:text-(--brand-blue-text)" aria-hidden="true">→</span>
        </Link>

        <section className="mt-[22px] grid grid-cols-2 gap-[18px] max-[1000px]:grid-cols-1" aria-label="Workspace actions">
          <article className="rounded-[10px] border border-(--border-shell) [background:var(--glass-surface)] p-[22px] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)">
            <p className={sectionKickerClass}>New class space</p>
            <h2 className="m-0 mb-[18px] text-[1.1875rem]">Create a workspace</h2>
            <CreateWorkspaceForm />
          </article>
          <article className="rounded-[10px] border border-(--border-shell) [background:var(--glass-surface)] p-[22px] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)">
            <p className={sectionKickerClass}>Teaching access</p>
            <h2 className="m-0 mb-[18px] text-[1.1875rem]">Join as co-professor</h2>
            <ProfessorRedeemForm />
          </article>
        </section>

        <section className="mt-[22px] rounded-[10px] border border-(--border-shell) [background:var(--glass-surface)] p-[24px_28px_28px] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) max-[600px]:p-5" aria-labelledby="professor-workspaces-title">
          <SectionHeading kicker="Class management" title="Teaching workspaces" titleId="professor-workspaces-title" aside={<span className={countBadgeClass}>{workspaces.data.length} total</span>} />

          {workspaces.error ? (
            <EmptyState error role="alert" title="Workspaces are unavailable">Refresh the page or try again later.</EmptyState>
          ) : workspaces.data.length === 0 ? (
            <EmptyState icon="＋" title="No teaching workspaces yet">Create a workspace or redeem a Professor invitation.</EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-[18px] pt-[22px] max-[600px]:grid-cols-1">
              {workspaces.data.map((workspace) => (
                <WorkspaceCard key={workspace.id} minHeight={205} role={workspace.is_owner ? "Owner" : "Co-professor"} name={workspace.name} detail={workspace.is_owner ? "Full management access" : "Student and roster access"} href={`/professor/workspaces/${workspace.id}`} linkLabel="Manage workspace" />
              ))}
            </div>
          )}
        </section>
      </PageMain>
    </ProfessorShell>
  );
}
