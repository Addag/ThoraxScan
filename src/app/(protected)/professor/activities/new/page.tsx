import type { Metadata } from "next";

import { ActivityPageHeading, ActivityStepRail } from "@/components/activities/activity-ui";
import { ActivityDetailsForm } from "@/components/professor/activity-forms";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "New activity | ThoraxScan",
};

export default async function NewProfessorActivityPage() {
  const profile = await requireRole("professor");
  const workspaces = await getProfessorWorkspaces(profile.id);

  return (
    <ProfessorShell activeItem="activities" sectionLabel="Activities" sectionDescription="Create activity">
      <main className="student-dashboard activity-dashboard">
        <ActivityPageHeading
          title="New activity"
          description="Start with the assignment details, then attach a private X-ray case"
          backHref="/professor/activities"
        />
        <ActivityStepRail role="professor" />
        {workspaces.error || workspaces.data.length === 0 ? (
          <div className="activity-empty-state activity-empty-state--error">
            <h2>A teaching workspace is required</h2>
            <p>Create or join a workspace before authoring an activity.</p>
          </div>
        ) : (
          <div className="activity-authoring-layout activity-authoring-layout--new">
            <aside className="activity-authoring-note">
              <span aria-hidden="true">i</span>
              <h2>Draft first</h2>
              <p>The draft is private to teaching staff. After it is saved, upload one de-identified frontal JPEG or PNG and publish when ready.</p>
            </aside>
            <ActivityDetailsForm workspaces={workspaces.data} />
          </div>
        )}
      </main>
    </ProfessorShell>
  );
}
