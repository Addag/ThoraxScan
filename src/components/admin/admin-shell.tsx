import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(protected)/actions";
import { AppSidebar } from "@/components/app-sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="student-app-shell admin-app-shell">
      <AppSidebar className="admin-sidebar">
        <div className="student-model-card admin-access-card">
          <span>Platform access</span>
          <strong><i aria-hidden="true" /> Administrator</strong>
        </div>
        <p className="student-nav-label">Administration</p>
        <nav aria-label="Administrator navigation">
          <Link aria-current="page" className="student-nav-link student-nav-link--active" href="/admin">
            <Image className="student-nav-icon" src="/images/menu-icons/dashboard.png" alt="" width={24} height={24} aria-hidden="true" /> Dashboard
          </Link>
          <span className="student-nav-link student-nav-link--disabled">
            <span aria-hidden="true">▤</span> Audit log <small>Coming soon</small>
          </span>
        </nav>
        <form className="student-logout" action={logoutAction}>
          <button type="submit"><span aria-hidden="true">↪</span> Log out</button>
        </form>
      </AppSidebar>
      <div className="student-main-column">
        <header className="student-topbar">
          <div><strong>Administration</strong><span>Professor approvals</span></div>
        </header>
        {children}
        <footer className="student-footer">
          <strong>ThoraxScan · v1.0.0 Prototype</strong>
          <span>Restricted administrator surface</span>
          <span>Account approval operations</span>
        </footer>
      </div>
    </div>
  );
}
