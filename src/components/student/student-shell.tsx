import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(protected)/actions";
import { Brand } from "@/components/brand";

export function StudentShell({ children }: { children: ReactNode }) {
  return (
    <div className="student-app-shell">
      <aside className="student-sidebar">
        <Brand className="student-brand" />
        <div className="student-model-card">
          <span>Active AI model</span>
          <strong><i aria-hidden="true" /> SqueezeViT</strong>
        </div>
        <p className="student-nav-label">Main menu</p>
        <nav aria-label="Student navigation">
          <Link className="student-nav-link student-nav-link--active" href="/student">
            <span aria-hidden="true">⌂</span> Dashboard
          </Link>
          <span className="student-nav-link student-nav-link--disabled">
            <span aria-hidden="true">▣</span> Activities <small>Coming soon</small>
          </span>
          <span className="student-nav-link student-nav-link--disabled">
            <span aria-hidden="true">◫</span> Learning mode <small>Coming soon</small>
          </span>
        </nav>
        <form className="student-logout" action={logoutAction}>
          <button type="submit"><span aria-hidden="true">↪</span> Log out</button>
        </form>
      </aside>
      <div className="student-main-column">
        <header className="student-topbar">
          <div><strong>Home</strong><span>Student workspaces</span></div>
        </header>
        {children}
        <footer className="student-footer">
          <strong>ThoraxScan · v1.0.0 Prototype</strong>
          <span>Assistive tool — not a standalone diagnosis</span>
          <span>ONNX Runtime Web · Local inference</span>
        </footer>
      </div>
    </div>
  );
}
