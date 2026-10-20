"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { Brand } from "@/components/brand";

export function AppSidebar({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <aside
      className="group sticky top-0 flex h-svh flex-col border-r border-r-(--border-shell) bg-(--glass-shell) px-3.5 pt-6 pb-5 backdrop-blur-[12px] max-[850px]:relative max-[850px]:h-auto max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:border-b-(--border-shell) max-[850px]:px-[18px] max-[850px]:py-3.5"
      data-expanded={expanded}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded) {
          setExpanded(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <Brand variant="sidebar" />
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        className="transition-[filter] duration-160 not-disabled:hover:brightness-115 hidden max-[850px]:absolute max-[850px]:top-2.5 max-[850px]:right-3.5 max-[850px]:inline-flex max-[850px]:min-h-11 max-[850px]:cursor-pointer max-[850px]:items-center max-[850px]:gap-1.5 max-[850px]:rounded-[10px] max-[850px]:border max-[850px]:border-[rgb(153_191_240/38%)] max-[850px]:p-2.5 max-[850px]:text-[14px] max-[850px]:text-foreground max-[850px]:[background:var(--glass-surface)]"
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
        className="flex min-h-0 flex-1 flex-col max-[850px]:hidden max-[850px]:group-data-[expanded=true]:mt-5 max-[850px]:group-data-[expanded=true]:flex"
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
