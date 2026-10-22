import { redirect } from "next/navigation";

import { logoutAction } from "@/app/(protected)/actions";
import { primaryButton } from "@/components/primary-button";
import { getCurrentProfile } from "@/lib/auth/server";
import { authEyebrowClass } from "@/components/field-error";

export default async function DashboardPage() {
  const result = await getCurrentProfile();

  if (!result.authenticated) {
    redirect("/login");
  }

  if (!result.profile) {
    return (
      <main className="min-h-svh [background:var(--glass-canvas)] px-[clamp(20px,6vw,88px)] pt-8 pb-20 text-foreground">
        <section className="mx-auto mt-[clamp(80px,14vh,150px)] w-[min(680px,100%)] rounded-[12px] border border-(--border-strong) p-[clamp(28px,5vw,52px)] [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)">
          <p className={authEyebrowClass}>Account unavailable</p>
          <h1 className="mx-0 mt-2.5 mb-[22px] text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]">Profile setup failed</h1>
          <p className="leading-[1.6] text-(--text-secondary)">{result.error}</p>
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

