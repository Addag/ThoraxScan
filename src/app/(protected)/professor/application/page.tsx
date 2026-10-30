import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfessorApplicationShell } from "@/components/professor/professor-application-shell";
import { rejectionReasonClass, reviewPanelClass } from "@/components/admin/review-styles";
import { getOwnProfessorApplication } from "@/lib/admin/server";
import { getCurrentProfile } from "@/lib/auth/server";
import { PageHeading, sectionKickerClass , PageMain} from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "Professor application | ThoraxScan",
};

export default async function ProfessorApplicationPage() {
  const result = await getCurrentProfile();
  if (!result.authenticated) redirect("/login");
  if (!result.profile) redirect("/dashboard");
  if (result.profile.role !== "professor") redirect("/dashboard");
  if (result.profile.professor_application_status === "approved") {
    redirect("/professor");
  }

  const application = await getOwnProfessorApplication(result.profile.id);
  if (!application) redirect("/dashboard");
  const isPending = application.status === "pending";

  return (
    <ProfessorApplicationShell>
      <PageMain>
        <PageHeading title="Professor application" subtitle={`${result.profile.display_name}, your account is awaiting workspace access.`} showDate={false} />

        <section className={`${reviewPanelClass} max-w-[790px] p-[clamp(24px,5vw,42px)]`}>
          <div className={`mb-[18px] grid size-12 place-items-center rounded-[12px] text-display ${isPending ? "bg-[rgba(255,193,7,0.15)] text-(--status-warning-text)" : "bg-[rgba(207,54,64,0.17)] text-(--status-error-text)"}`} aria-hidden="true">
            {isPending ? "◷" : "!"}
          </div>
          <p className={sectionKickerClass}>Application status</p>
          <h2 className="m-0 text-display">{isPending ? "Review pending" : "Application not approved"}</h2>
          <p className="max-w-[650px] text-body leading-relaxed text-(--text-muted)">
            {isPending
              ? "An administrator must approve your Professor application before you can create or join teaching workspaces."
              : "Your Professor application was reviewed and rejected. Contact an administrator if your eligibility has changed."}
          </p>

          {application.rejection_reason && (
            <div className={rejectionReasonClass}>
              <strong>Administrator reason</strong>
              <p className="mt-[5px]">{application.rejection_reason}</p>
            </div>
          )}

          <dl className="mt-6 grid gap-2.5">
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-t border-(--border-shell) pt-2.5 max-[560px]:grid-cols-1">
              <dt className="text-label text-(--text-muted) uppercase tracking-[0.08em] font-extrabold">Submitted</dt>
              <dd className="m-0 text-caption font-extrabold">{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(application.requested_at))}</dd>
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-t border-(--border-shell) pt-2.5 max-[560px]:grid-cols-1">
              <dt className="text-label text-(--text-muted) uppercase tracking-[0.08em] font-extrabold">Access</dt>
              <dd className="m-0 text-caption font-extrabold">Professor workspace features locked</dd>
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-t border-(--border-shell) pt-2.5 max-[560px]:grid-cols-1">
              <dt className="text-label text-(--text-muted) uppercase tracking-[0.08em] font-extrabold">Notification</dt>
              <dd className="m-0 text-caption font-extrabold">Return to this page to see the review result</dd>
            </div>
          </dl>
        </section>
      </PageMain>
    </ProfessorApplicationShell>
  );
}
