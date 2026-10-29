import type { AppRole } from "@/lib/auth/types";
import { requireRole } from "@/lib/auth/server";
import { getSettingsPageData } from "@/lib/settings/server";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { StudentShell } from "@/components/student/student-shell";
import { PageHeading, PageMain } from "@/components/dashboard-ui";

export async function RoleSettingsPage({ role }: { role: AppRole }) {
  const profile = await requireRole(role);
  const pageData = await getSettingsPageData(profile.id);
  const content = (
    <PageMain>
      <PageHeading title="User Profile" subtitle="Manage your account profile, security, privacy, and accessibility settings." />
      <SettingsForm
        email={pageData.email}
        initialDisplayName={profile.display_name}
        initialSettings={pageData.settings}
        loadError={pageData.error}
        pendingEmail={pageData.pendingEmail}
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
