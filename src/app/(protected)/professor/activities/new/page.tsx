import type { Metadata } from "next";

import { ActivityStepRail, activityLayoutClass } from "@/components/activities/activity-ui";
import { ActivityDetailsForm } from "@/components/professor/activity-forms";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { PageHeading, PageMain } from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "New activity | ThoraxScan",
};

export default async function NewProfessorActivityPage() {
  const profile = await requireRole("professor");
  const workspaces = await getProfessorWorkspaces(profile.id);

  return (
    <ProfessorShell activeItem="activities" sectionLabel="Activities" sectionDescription="Create activity">
      <PageMain>
        <PageHeading
          title="New activity"
          subtitle="Start with the assignment details, then attach a private X-ray case"
          back={{ href: "/professor/activities", label: "Back to activities" }}
        />
        <ActivityStepRail role="professor" />
        {workspaces.error || workspaces.data.length === 0 ? (
          <EmptyState variant="card" error title="A teaching workspace is required">Create or join a workspace before authoring an activity.</EmptyState>
        ) : (
          <div className={activityLayoutClass("new")}>
            <aside className="rounded-panel border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) sticky top-6 p-6 max-[1050px]:static">
              <span className="grid size-[35px] place-items-center rounded-full border border-brand font-extrabold text-(--brand-blue-text)" aria-hidden="true">i</span>
              <h2 className="mx-0 mt-[17px] mb-[7px] text-[1.25rem]">Draft first</h2>
              <p className="m-0 text-[0.75rem] leading-[1.6] text-(--text-muted)">The draft is private to teaching staff. After it is saved, upload one de-identified frontal JPEG or PNG and publish when ready.</p>
            </aside>
            <ActivityDetailsForm workspaces={workspaces.data} />
          </div>
        )}
      </PageMain>
    </ProfessorShell>
  );
}
