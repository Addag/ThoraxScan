import type { AppRole } from "@/lib/auth/types";
import { requireRole } from "@/lib/auth/server";
import { getSettingsPageData } from "@/lib/settings/server";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { StudentShell } from "@/components/student/student-shell";
import { PageMain } from "@/components/dashboard-ui";

export async function RoleSettingsPage({ role }: { role: AppRole }) {
  const profile = await requireRole(role);
  const pageData = await getSettingsPageData(profile.id);
  const content = (
    <PageMain
      width="w-[min(1110px,calc(100%-44px))] max-[850px]:w-[min(1110px,calc(100%-36px))] max-[600px]:w-[min(1110px,calc(100%-28px))]"
      bottom="pb-[34px]"
    >
      <header className="mb-[34px] flex items-end justify-between gap-6 max-[600px]:mb-6 max-[600px]:items-start max-[600px]:flex-col">
        <div>
          <h1 className="m-0 text-[clamp(28px,4vw,38px)] leading-[1.1]">User Profile</h1>
          <p className="mt-1.5 mb-0 text-[13px] leading-[1.4] text-(--text-muted)">Manage your account profile, display preferences, and privacy information.</p>
        </div>
        <time className="flex-none rounded bg-[rgba(85,85,85,0.75)] light:bg-(--surface-sunken) px-[15px] py-[9px] text-[11px] text-(--text-primary) max-[600px]:self-start" dateTime={new Date().toISOString().slice(0, 10)}>
          {new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date())}
        </time>
      </header>
      <SettingsForm
        email={pageData.email}
        initialDisplayName={profile.display_name}
        initialSettings={pageData.settings}
        loadError={pageData.error}
        role={role}
      />
    </PageMain>
  );

  if (role === "professor") {
    return (
      <ProfessorShell
        activeItem="settings"
        sectionLabel="Home / User Profile"
        sectionDescription="Teaching account preferences"
      >
        {content}
      </ProfessorShell>
    );
  }

  return (
    <StudentShell
      activeItem="settings"
      sectionLabel="Home / User Profile"
      sectionDescription="Learning account preferences"
    >
      {content}
    </StudentShell>
  );
}
