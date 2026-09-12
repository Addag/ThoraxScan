import type { ReactNode } from "react";

import { logoutAction } from "@/app/(protected)/actions";
import { AppSidebar } from "@/components/app-sidebar";

export function ProfessorApplicationShell({ children }: { children: ReactNode }) {
  return (
    <div className="student-app-shell professor-application-shell">
      <AppSidebar className="professor-sidebar">
        <div className="student-model-card professor-application-access-card">
          <span>Account access</span>
          <strong><i aria-hidden="true" /> Review required</strong>
        </div>
        <p className="student-nav-label">Professor account</p>
        <nav aria-label="Professor application navigation">
          <span className="student-nav-link student-nav-link--active">
            <span aria-hidden="true">◷</span> Application status
          </span>
        </nav>
        <form className="student-logout" action={logoutAction}>
          <button type="submit"><span aria-hidden="true">↪</span> Log out</button>
        </form>
      </AppSidebar>
      <div className="student-main-column">
        <header className="student-topbar">
          <div><strong>Professor application</strong><span>Account review status</span></div>
        </header>
        {children}
        <footer className="student-footer">
          <strong>ThoraxScan · v1.0.0 Prototype</strong>
          <span>Workspace access requires approval</span>
          <span>Review results appear on this page</span>
        </footer>
      </div>
    </div>
  );
}
