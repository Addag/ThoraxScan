import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

export function ProfessorShell({
  children,
  activeItem = "dashboard",
  sectionLabel = "Home",
  sectionDescription = "Teaching workspaces",
}: {
  children: ReactNode;
  activeItem?: "dashboard" | "activities" | "submissions" | "learning" | "attention" | "settings";
  sectionLabel?: string;
  sectionDescription?: string;
}) {
  return (
    <AppShell
      accessLabel="Model status"
      accessValue="AI model · resolved on analysis"
      navLabel="Main menu"
      navAriaLabel="Professor navigation"
      navItems={[
        { label: "Student Reviews", href: "/professor/submissions", active: activeItem === "submissions" },
        { label: "Dashboard", href: "/professor", icon: "dashboard", active: activeItem === "dashboard" },
        { label: "Activities", href: "/professor/activities", icon: "activities", active: activeItem === "activities" },
        { label: "Learning mode", href: "/professor/learning", icon: "learning", active: activeItem === "learning" },
        { label: "Attention maps", href: "/professor/attention", icon: "attention", active: activeItem === "attention" },
        { label: "Settings", href: "/professor/settings", icon: "settings", active: activeItem === "settings" },
      ]}
      sectionLabel={sectionLabel}
      sectionDescription={sectionDescription}
      footerNotes={["Assistive tool — not a standalone diagnosis", "ONNX Runtime Web · in-browser inference"]}
    >
      {children}
    </AppShell>
  );
}
