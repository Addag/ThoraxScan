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
        { label: "Dashboard", href: "/admin", icon: "dashboard", active: true },
        { label: "Audit log", glyph: "▤", note: "Coming soon", disabled: true },
      ]}
      sectionLabel="Administration"
      sectionDescription="Professor approvals"
      footerNotes={["Restricted administrator surface", "Account approval operations"]}
    >
      {children}
    </AppShell>
  );
}
