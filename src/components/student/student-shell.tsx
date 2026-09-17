import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(protected)/actions";
import { AppSidebar } from "@/components/app-sidebar";

export function StudentShell({
  children,
  activeItem = "dashboard",
  sectionLabel = "Home",
  sectionDescription = "Student workspaces",
}: {
  children: ReactNode;
  activeItem?: "dashboard" | "activities" | "learning" | "settings";
  sectionLabel?: string;
  sectionDescription?: string;
}) {
  return (
    <div className="student-app-shell">
      <AppSidebar>
        <div className="student-model-card">
          <span>Model status</span>
          <strong><i aria-hidden="true" /> AI model · resolved on analysis</strong>
        </div>
        <p className="student-nav-label">Main menu</p>
        <nav aria-label="Student navigation">
          <Link aria-current={activeItem === "dashboard" ? "page" : undefined} className={`student-nav-link ${activeItem === "dashboard" ? "student-nav-link--active" : ""}`} href="/student">
            <Image className="student-nav-icon" src="/images/menu-icons/dashboard.png" alt="" width={24} height={24} aria-hidden="true" /> Dashboard
          </Link>
          <Link aria-current={activeItem === "activities" ? "page" : undefined} className={`student-nav-link ${activeItem === "activities" ? "student-nav-link--active" : ""}`} href="/student/activities">
            <Image className="student-nav-icon" src="/images/menu-icons/activities.png" alt="" width={24} height={24} aria-hidden="true" /> Activities
          </Link>
          <Link aria-current={activeItem === "learning" ? "page" : undefined} className={`student-nav-link ${activeItem === "learning" ? "student-nav-link--active" : ""}`} href="/student/learning">
            <Image className="student-nav-icon" src="/images/menu-icons/learning.png" alt="" width={24} height={24} aria-hidden="true" /> Learning mode
          </Link>
          <Link aria-current={activeItem === "settings" ? "page" : undefined} className={`student-nav-link ${activeItem === "settings" ? "student-nav-link--active" : ""}`} href="/student/settings">
            <Image className="student-nav-icon" src="/images/menu-icons/settings.png" alt="" width={24} height={24} aria-hidden="true" /> Settings
          </Link>
        </nav>
        <form className="student-logout" action={logoutAction}>
          <button type="submit"><span aria-hidden="true">↪</span> Log out</button>
        </form>
      </AppSidebar>
      <div className="student-main-column">
        <header className="student-topbar">
          <div><strong>{sectionLabel}</strong><span>{sectionDescription}</span></div>
        </header>
        {children}
        <footer className="student-footer">
          <strong>ThoraxScan · v1.0.0 Prototype</strong>
          <span>Assistive tool — not a standalone diagnosis</span>
          <span>ONNX Runtime Web · in-browser inference</span>
        </footer>
      </div>
    </div>
  );
}
