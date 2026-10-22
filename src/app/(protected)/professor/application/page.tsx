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
      <PageMain bottom="pb-[60px]">
        <PageHeading title="Professor application" subtitle={`${result.profile.display_name}, your account is awaiting workspace access.`} showDate={false} />

        <section className={`${reviewPanelClass} max-w-[790px] p-[clamp(24px,5vw,42px)]`}>
          <div className={`mb-[18px] grid size-[58px] place-items-center rounded-[12px] text-[1.875rem] ${isPending ? "bg-[rgba(255,193,7,0.15)] text-[#ffd166] light:text-(--status-warning-text)" : "bg-[rgba(207,54,64,0.17)] text-[#ff8585] light:text-(--status-error-text)"}`} aria-hidden="true">
            {isPending ? "◷" : "!"}
          </div>
          <p className={sectionKickerClass}>Application status</p>
          <h2 className="m-0 text-[clamp(1.5625rem,4vw,2.125rem)]">{isPending ? "Review pending" : "Application not approved"}</h2>
          <p className="max-w-[650px] text-[0.875rem] leading-[1.65] text-[#aeb6c5] light:text-(--text-muted)">
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
              <dt className="text-[0.6875rem] text-[#8893a8] light:text-(--text-muted) uppercase">Submitted</dt>
              <dd className="m-0 text-[0.75rem] font-bold">{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(application.requested_at))}</dd>
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-t border-(--border-shell) pt-2.5 max-[560px]:grid-cols-1">
              <dt className="text-[0.6875rem] text-[#8893a8] light:text-(--text-muted) uppercase">Access</dt>
              <dd className="m-0 text-[0.75rem] font-bold">Professor workspace features locked</dd>
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-t border-(--border-shell) pt-2.5 max-[560px]:grid-cols-1">
              <dt className="text-[0.6875rem] text-[#8893a8] light:text-(--text-muted) uppercase">Notification</dt>
              <dd className="m-0 text-[0.75rem] font-bold">Return to this page to see the review result</dd>
            </div>
          </dl>
        </section>
      </PageMain>
    </ProfessorApplicationShell>
  );
}
