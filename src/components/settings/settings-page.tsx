import type { AppRole } from "@/lib/auth/types";
import { requireRole } from "@/lib/auth/server";
import { getSettingsPageData } from "@/lib/settings/server";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { StudentShell } from "@/components/student/student-shell";

export async function RoleSettingsPage({ role }: { role: AppRole }) {
  const profile = await requireRole(role);
  const pageData = await getSettingsPageData(profile.id);
  const content = (
    <main className="student-dashboard settings-dashboard">
      <header className="settings-page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your account profile, display preferences, and privacy information.</p>
        </div>
        <time dateTime={new Date().toISOString().slice(0, 10)}>
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
    </main>
  );

  if (role === "professor") {
    return (
      <ProfessorShell
        activeItem="settings"
        sectionLabel="Home / Settings"
        sectionDescription="Teaching account preferences"
      >
        {content}
      </ProfessorShell>
    );
  }

  return (
    <StudentShell
      activeItem="settings"
      sectionLabel="Home / Settings"
      sectionDescription="Learning account preferences"
    >
      {content}
    </StudentShell>
  );
}
