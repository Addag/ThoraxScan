import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

export function ProfessorApplicationShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      accessLabel="Account access"
      accessValue="Review required"
      accessTone="warning"
      navLabel="Professor account"
      navAriaLabel="Professor application navigation"
      navItems={[{ label: "Application status", icon: "application.svg", active: true }]}
      sectionLabel="Professor application"
      sectionDescription="Account review status"
      footerNotes={["Workspace access requires approval", "Review results appear on this page"]}
    >
      {children}
    </AppShell>
  );
}
