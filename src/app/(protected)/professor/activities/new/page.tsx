import type { Metadata } from "next";

import { ActivityPageHeading, ActivityStepRail, activityLayoutClass } from "@/components/activities/activity-ui";
import { ActivityDetailsForm } from "@/components/professor/activity-forms";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { PageMain } from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "New activity | ThoraxScan",
};

export default async function NewProfessorActivityPage() {
  const profile = await requireRole("professor");
  const workspaces = await getProfessorWorkspaces(profile.id);

  return (
    <ProfessorShell activeItem="activities" sectionLabel="Activities" sectionDescription="Create activity">
      <PageMain>
        <ActivityPageHeading
          title="New activity"
          description="Start with the assignment details, then attach a private X-ray case"
          backHref="/professor/activities"
        />
        <ActivityStepRail role="professor" />
        {workspaces.error || workspaces.data.length === 0 ? (
          <EmptyState variant="card" error title="A teaching workspace is required">Create or join a workspace before authoring an activity.</EmptyState>
        ) : (
          <div className={activityLayoutClass("new")}>
            <aside className="rounded-[10px] border border-[#33425c] [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) sticky top-6 p-[25px] max-[1050px]:static">
              <span className="grid size-[35px] place-items-center rounded-full border border-brand font-extrabold text-[#5eb6ff]" aria-hidden="true">i</span>
              <h2 className="mx-0 mt-[17px] mb-[7px] text-[20px]">Draft first</h2>
              <p className="m-0 text-[12px] leading-[1.6] text-[#9ca5b3]">The draft is private to teaching staff. After it is saved, upload one de-identified frontal JPEG or PNG and publish when ready.</p>
            </aside>
            <ActivityDetailsForm workspaces={workspaces.data} />
          </div>
        )}
      </PageMain>
    </ProfessorShell>
  );
}
