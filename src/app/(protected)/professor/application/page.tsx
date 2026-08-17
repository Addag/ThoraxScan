import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfessorApplicationShell } from "@/components/professor/professor-application-shell";
import { getOwnProfessorApplication } from "@/lib/admin/server";
import { getCurrentProfile } from "@/lib/auth/server";

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
      <main className="student-dashboard professor-application-page">
        <div className="student-page-heading">
          <div>
            <h1>Professor application</h1>
            <p>{result.profile.display_name}, your account is awaiting workspace access.</p>
          </div>
        </div>

        <section className={`professor-application-card professor-application-card--${application.status}`}>
          <div className="professor-application-card__icon" aria-hidden="true">
            {isPending ? "◷" : "!"}
          </div>
          <p className="student-section-kicker">Application status</p>
          <h2>{isPending ? "Review pending" : "Application not approved"}</h2>
          <p>
            {isPending
              ? "An administrator must approve your Professor application before you can create or join teaching workspaces."
              : "Your Professor application was reviewed and rejected. Contact an administrator if your eligibility has changed."}
          </p>

          {application.rejection_reason && (
            <div className="professor-application-reason">
              <strong>Administrator reason</strong>
              <p>{application.rejection_reason}</p>
            </div>
          )}

          <dl>
            <div>
              <dt>Submitted</dt>
              <dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(application.requested_at))}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>Professor workspace features locked</dd>
            </div>
            <div>
              <dt>Notification</dt>
              <dd>Return to this page to see the review result</dd>
            </div>
          </dl>
        </section>
      </main>
    </ProfessorApplicationShell>
  );
}
