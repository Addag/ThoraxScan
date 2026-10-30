import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      accessLabel="Platform access"
      accessValue="Administrator"
      accessTone="warning"
      navLabel="Administration"
      navAriaLabel="Administrator navigation"
      navItems={[
        { label: "Home", href: "/admin", icon: "dashboard.png", active: true },
      ]}
      sectionLabel="Administration"
      sectionDescription="Professor approvals"
      footerNotes={["Restricted administrator surface", "Account approval operations"]}
    >
      {children}
    </AppShell>
  );
}
