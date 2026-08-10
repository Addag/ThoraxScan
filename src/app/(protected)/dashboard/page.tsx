import { redirect } from "next/navigation";

import { logoutAction } from "@/app/(protected)/actions";
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
            <button className="primary-button" type="submit">
              Log out
            </button>
          </form>
        </section>
      </main>
    );
  }

  redirect(`/${result.profile.role}`);
}
