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
        { label: "Home", href: "/student", icon: "dashboard", active: activeItem === "dashboard" },
        { label: "Activities", href: "/student/activities", icon: "activities", active: activeItem === "activities" },
        { label: "Learning mode", href: "/student/learning", icon: "learning", active: activeItem === "learning" },
        { label: "Attention maps", href: "/student/attention", icon: "attention", active: activeItem === "attention" },
        { label: "User Profile", href: "/student/settings", icon: "settings", active: activeItem === "settings" },
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
