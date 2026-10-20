"use client";

import { useLayoutEffect } from "react";

// Visible state comes from the `light:` variant on <html data-theme>, so server and client render the same markup.
// The inline script in app/layout.tsx applies the saved theme before first paint.

const iconClass = "size-6 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  if (next === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem("theme", next);
  } catch {}
}

// Dev-only: Strict Mode's remount strips attributes React doesn't own from <html>; re-apply the saved theme.
function useReapplyTheme() {
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem("theme") === "light") document.documentElement.setAttribute("data-theme", "light");
    } catch {}
  }, []);
}

function ThemeIcon({ className = iconClass }: { className?: string }) {
  return (
    <>
      <svg className={`${className} light:hidden`} aria-hidden="true" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      <svg className={`${className} hidden light:block`} aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </>
  );
}

/** Labelled switch on the User Profile page. */
export function ThemeToggle() {
  useReapplyTheme();
  return (
    <button
      className="group/theme mt-[17px] mb-5 ml-[26px] flex cursor-pointer items-center gap-3 rounded-full border-0 bg-transparent p-0 pr-3 text-left text-(--text-primary)"
      onClick={toggleTheme}
      type="button"
    >
      <span className="grid size-[52px] place-items-center rounded-full bg-[linear-gradient(180deg,#56c7ff_0%,#5557b8_100%)] text-white transition-[filter] duration-160 group-hover/theme:brightness-115 light:bg-[linear-gradient(180deg,#ffd76a_0%,#ff9b3d_100%)]" aria-hidden="true">
        <ThemeIcon />
      </span>
      <span className="grid gap-0.5">
        <strong className="text-[14px] light:hidden">Dark theme</strong>
        <strong className="hidden text-[14px] light:block">Light theme</strong>
        <small className="text-[12px] text-(--text-muted) light:hidden">Switch to light</small>
        <small className="hidden text-[12px] text-(--text-muted) light:block">Switch to dark</small>
      </span>
    </button>
  );
}

/** Icon-only sun/moon button for the app header. */
export function ThemeIconButton() {
  useReapplyTheme();
  return (
    <button
      className="transition-colors duration-160 grid size-10 flex-none cursor-pointer place-items-center rounded-full border border-(--border-shell) bg-transparent text-(--text-primary) hover:bg-(--hover-overlay)"
      onClick={toggleTheme}
      type="button"
    >
      <ThemeIcon className="size-5 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" />
      <span className="sr-only light:hidden">Switch to light theme</span>
      <span className="hidden light:inline light:sr-only">Switch to dark theme</span>
    </button>
  );
}
