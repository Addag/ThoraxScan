import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { getNotifications } from "@/lib/notifications/server";

export async function ProfessorShell({
  children,
  activeItem = "dashboard",
  sectionLabel = "Home",
  sectionDescription = "Teaching workspaces",
}: {
  children: ReactNode;
  activeItem?: "dashboard" | "activities" | "submissions" | "learning" | "attention" | "analytics" | "settings";
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
        { label: "Home", href: "/professor", icon: "dashboard.png", active: activeItem === "dashboard" },
        { label: "Activities", href: "/professor/activities", icon: "activities.png", active: activeItem === "activities" },
        { label: "Student Reviews", href: "/professor/submissions", icon: "reviews.png", active: activeItem === "submissions" },
        { label: "Class Analytics", href: "/professor/analytics", icon: "analytics.svg", active: activeItem === "analytics" },
        { label: "Learning Mode", href: "/professor/learning", icon: "learning.png", active: activeItem === "learning" },
        { label: "Attention Maps", href: "/professor/attention", icon: "attention.png", active: activeItem === "attention" },
        { label: "User Profile", href: "/professor/settings", icon: "settings.png", active: activeItem === "settings" },
      ]}
      sectionLabel={sectionLabel}
      sectionDescription={sectionDescription}
      footerNotes={["Assistive tool — not a standalone diagnosis", "ONNX Runtime Web · in-browser inference"]}
      notifications={await getNotifications("professor")}
    >
      {children}
    </AppShell>
  );
}
