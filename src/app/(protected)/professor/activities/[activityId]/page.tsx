import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActivityPageHeading,
  ActivityStatusBadge,
  ActivityStepRail,
  XrayCasePreview,
  formatDueDate,
  activitiesCtaClass,
  activityLayoutClass, activityCaseColumnClass, activityConfigColumnClass,
} from "@/components/activities/activity-ui";
import {
  ActivityDetailsForm,
  ActivityLifecycleControls,
  CaseUploadForm,
} from "@/components/professor/activity-forms";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { getProfessorActivity } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";
import { getOwnAccountSettings } from "@/lib/settings/server";
import { getProfessorWorkspaces } from "@/lib/workspaces/server";
import { ActivityAIStatus } from "@/components/activities/activity-ai-status";
import { PageMain } from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "Manage activity | ThoraxScan",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ProfessorActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const profile = await requireRole("professor");
  const { activityId } = await params;
  if (!uuidPattern.test(activityId)) notFound();

  const [activity, workspaces, accountSettings] = await Promise.all([
    getProfessorActivity(activityId),
    getProfessorWorkspaces(profile.id),
    getOwnAccountSettings(profile.id),
  ]);
  if (!activity) notFound();

  return (
    <ProfessorShell activeItem="activities" sectionLabel="Activities" sectionDescription={activity.workspaceName}>
      <PageMain>
        <ActivityPageHeading
          title={activity.title}
          description={`${activity.workspaceName} · ${formatDueDate(activity.dueAt)}`}
          backHref="/professor/activities"
        />
        <div className="-mt-2 mb-[18px] flex items-center gap-3 text-[12px] text-[#aab1bf]">
          <ActivityStatusBadge status={activity.status} />
          <span>{activity.status === "published" ? "Visible to current and future workspace students" : activity.status === "archived" ? "No longer visible to students" : "Visible to teaching staff only"}</span>
        </div>
        <ActivityStepRail role="professor" />
        <Link className={activitiesCtaClass} href={`/professor/submissions?activity=${activity.id}`}>Review submissions</Link>

        <div className={activityLayoutClass("default")}>
          <div className={activityCaseColumnClass}>
            <XrayCasePreview
              imageUrl={activity.imageUrl}
              imageError={activity.imageError}
              title={activity.title}
              status={activity.caseUploadStatus}
              darkImageBackground={accountSettings.settings.darkImageBackground}
            />
            {activity.status === "draft" ? <CaseUploadForm activityId={activity.id} caseId={activity.caseId} /> : null}
            <ActivityAIStatus activityId={activity.id} imageUrl={activity.imageUrl} activityStatus={activity.status} initial={activity.aiStatus} />
          </div>
          <div className={activityConfigColumnClass}>
            <ActivityDetailsForm workspaces={workspaces.data} activity={activity} />
            <ActivityLifecycleControls activity={activity} />
          </div>
        </div>
      </PageMain>
    </ProfessorShell>
  );
}
