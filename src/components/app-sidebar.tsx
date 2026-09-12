"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { Brand } from "@/components/brand";

export function AppSidebar({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <aside
      className={`student-sidebar ${className}`}
      data-expanded={expanded}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded) {
          setExpanded(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <Brand className="student-brand" />
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        className="sidebar-menu-toggle"
        onClick={() => setExpanded(!expanded)}
        ref={toggleRef}
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d={expanded ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
        {expanded ? "Close" : "Menu"}
      </button>
      <div
        className="sidebar-content"
        id={contentId}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a[href]")) {
            setExpanded(false);
          }
        }}
      >
        {children}
      </div>
    </aside>
  );
}
