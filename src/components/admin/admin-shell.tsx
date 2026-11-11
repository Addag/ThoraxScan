import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

const sections = {
  home: { label: "Home", href: "/admin", icon: "dashboard.png", description: "Platform overview" },
  applications: { label: "Applications", href: "/admin/applications", icon: "application.svg", description: "Professor approvals" },
  accounts: { label: "Accounts", href: "/admin/accounts", icon: "settings.png", description: "Accounts and administrators" },
  notices: { label: "Site notices", href: "/admin/notices", icon: "activities.png", description: "Site-wide notices" },
} as const;

export function AdminShell({ children, activeItem = "home" }: { children: ReactNode; activeItem?: keyof typeof sections }) {
  return (
    <AppShell
      accessLabel="Platform access"
      accessValue="Administrator"
      accessTone="warning"
      navLabel="Administration"
      navAriaLabel="Administrator navigation"
      navItems={Object.entries(sections).map(([key, item]) => ({ ...item, active: key === activeItem }))}
      sectionLabel="Administration"
      sectionDescription={sections[activeItem].description}
      footerNotes={["Restricted administrator surface", "Account and platform operations"]}
    >
      {children}
    </AppShell>
  );
}
