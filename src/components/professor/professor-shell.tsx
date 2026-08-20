import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(protected)/actions";
import { Brand } from "@/components/brand";

export function ProfessorShell({
  children,
  activeItem = "dashboard",
  sectionLabel = "Home",
  sectionDescription = "Teaching workspaces",
}: {
  children: ReactNode;
  activeItem?: "dashboard" | "activities";
  sectionLabel?: string;
  sectionDescription?: string;
}) {
  return (
    <div className="student-app-shell professor-app-shell">
      <aside className="student-sidebar professor-sidebar">
        <Brand className="student-brand" />
        <div className="student-model-card">
          <span>Future AI model</span>
          <strong><i aria-hidden="true" /> SqueezeViT · inactive</strong>
        </div>
        <p className="student-nav-label">Main menu</p>
        <nav aria-label="Professor navigation">
          <Link className={`student-nav-link ${activeItem === "dashboard" ? "student-nav-link--active" : ""}`} href="/professor">
            <span aria-hidden="true">⌂</span> Dashboard
          </Link>
          <Link className={`student-nav-link ${activeItem === "activities" ? "student-nav-link--active" : ""}`} href="/professor/activities">
            <span aria-hidden="true">▣</span> Activities
          </Link>
          <span className="student-nav-link student-nav-link--disabled">
            <span aria-hidden="true">◫</span> Evaluations <small>Coming soon</small>
          </span>
        </nav>
        <form className="student-logout" action={logoutAction}>
          <button type="submit"><span aria-hidden="true">↪</span> Log out</button>
        </form>
      </aside>
      <div className="student-main-column">
        <header className="student-topbar">
          <div><strong>{sectionLabel}</strong><span>{sectionDescription}</span></div>
        </header>
        {children}
        <footer className="student-footer">
          <strong>ThoraxScan · v1.0.0 Prototype</strong>
          <span>Assistive tool — not a standalone diagnosis</span>
          <span>AI inference · Future milestone</span>
        </footer>
      </div>
    </div>
  );
}
