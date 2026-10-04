import { redirect } from "next/navigation";

import { logoutAction } from "@/app/(protected)/actions";
import { primaryButton } from "@/components/primary-button";
import { getCurrentProfile } from "@/lib/auth/server";

export default async function DashboardPage() {
  const result = await getCurrentProfile();

  if (!result.authenticated) {
    redirect("/login");
  }

  if (!result.profile) {
    return (
      <main className="role-page">
        <section className="role-card">
          <p className="auth-eyebrow">Account unavailable</p>
          <h1>Profile setup failed</h1>
          <p>{result.error}</p>
          <form action={logoutAction}>
            <button className={`${primaryButton} mt-[18px] min-h-12 min-w-[150px]`} type="submit">
              Log out
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (
    result.profile.role === "professor" &&
    result.profile.professor_application_status !== "approved"
  ) {
    redirect("/professor/application");
  }

  redirect(`/${result.profile.role}`);
}

