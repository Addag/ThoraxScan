import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { getNotifications } from "@/lib/notifications/server";

export async function StudentShell({
  children,
  activeItem = "dashboard",
  sectionLabel = "Home",
  sectionDescription = "Student workspaces",
}: {
  children: ReactNode;
  activeItem?: "dashboard" | "activities" | "learning" | "attention" | "settings";
  sectionLabel?: string;
  sectionDescription?: string;
}) {
  return (
    <AppShell
      accessLabel="Model status"
      accessValue="AI model · resolved on analysis"
      navLabel="Main menu"
      navAriaLabel="Student navigation"
      navItems={[
        { label: "Home", href: "/student", icon: "dashboard.png", active: activeItem === "dashboard" },
        { label: "Activities", href: "/student/activities", icon: "activities.png", active: activeItem === "activities" },
        { label: "Learning Mode", href: "/student/learning", icon: "learning.png", active: activeItem === "learning" },
        { label: "Attention Maps", href: "/student/attention", icon: "attention.png", active: activeItem === "attention" },
        { label: "User Profile", href: "/student/settings", icon: "settings.png", active: activeItem === "settings" },
      ]}
      sectionLabel={sectionLabel}
      sectionDescription={sectionDescription}
      footerNotes={["Assistive tool — not a standalone diagnosis", "ONNX Runtime Web · in-browser inference"]}
      notifications={await getNotifications("student")}
    >
      {children}
    </AppShell>
  );
}
