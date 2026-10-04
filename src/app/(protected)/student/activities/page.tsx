import { submissionLabel } from "@/lib/submissions/types";
import type { Metadata } from "next";
import Link from "next/link";

import {
  ActivityPageHeading,
  dueStateColor,
  formatDueDate,
} from "@/components/activities/activity-ui";
import { StudentShell } from "@/components/student/student-shell";
import { EmptyState } from "@/components/empty-state";
import { getStudentActivities } from "@/lib/activities/server";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Activities | ThoraxScan",
};

export default async function StudentActivitiesPage() {
  await requireRole("student");
  const activities = await getStudentActivities();

  return (
    <StudentShell activeItem="activities" sectionLabel="Activities" sectionDescription="Published class activities">
      <main className="student-dashboard">
        <ActivityPageHeading description="Review published chest X-ray assignments from your workspaces" />

        {activities.error ? (
          <EmptyState variant="card" error role="alert" title="Activities are unavailable">Refresh the page or try again later.</EmptyState>
        ) : activities.data.length === 0 ? (
          <EmptyState variant="card" icon="▣" title="No published activities yet">Activities will appear here as soon as teaching staff publish them.</EmptyState>
        ) : (
          <div className="grid gap-3.5">
            {activities.data.map((activity) => (
              <article className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-[18px] rounded-[10px] border border-[#33425c] bg-[#18202d] px-5 py-[18px] max-[760px]:grid-cols-[50px_minmax(0,1fr)]" key={activity.id}>
                <div className="grid size-[50px] place-items-center rounded-full bg-brand text-[22px]" aria-hidden="true">◉</div>
                <div>
                  <p className="mx-0 mt-0 mb-1 text-[10px] font-extrabold uppercase text-[#8f98a8]">{activity.workspaceName}</p>
                  <h2 className="mx-0 mt-0 mb-[7px] text-[19px]">{activity.title}</h2>
                  <span className={`text-[11px] ${dueStateColor(activity.dueAt)}`}>
                    {submissionLabel(activity.submissionStatus, activity.dueAt)} · {activity.aiStatus === "ready" ? "Feedback available" : activity.aiStatus === "pending" ? "Analysis pending" : activity.aiStatus === "failed" ? "Analysis failed · retry available" : "AI feedback locked"} · {formatDueDate(activity.dueAt)}
                  </span>
                </div>
                <Link className="text-[12px] font-extrabold text-[#70bdff] no-underline max-[760px]:col-span-full max-[760px]:border-t max-[760px]:border-[#39465b] max-[760px]:pt-[13px]" href={`/student/activities/${activity.id}`}>Review activity <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </StudentShell>
  );
}
