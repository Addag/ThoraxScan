"use client";

import { useLayoutEffect } from "react";

// Visible state comes from the `light:` variant on <html data-theme>, so server and client render the same markup.
// The inline script in app/layout.tsx applies the saved theme before first paint.

const iconClass = "size-5 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  if (next === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem("theme", next);
  } catch {}
}

/** Icon-only sun/moon theme button for the app header and the mobile menu bar. */
export function ThemeIconButton({ className = "size-10" }: { className?: string }) {
  // Dev-only: Strict Mode's remount strips attributes React doesn't own from <html>; re-apply the saved theme.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem("theme") === "light") document.documentElement.setAttribute("data-theme", "light");
    } catch {}
  }, []);

  return (
    <button
      className={`${className} transition-colors duration-160 grid flex-none cursor-pointer place-items-center rounded-full border border-(--border-shell) bg-transparent text-(--text-primary) hover:bg-(--hover-overlay)`}
      onClick={toggleTheme}
      type="button"
    >
      <svg className={`${iconClass} light:hidden`} aria-hidden="true" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      <svg className={`${iconClass} hidden light:block`} aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      <span className="sr-only light:hidden">Switch to light theme</span>
      <span className="hidden light:inline light:sr-only">Switch to dark theme</span>
    </button>
  );
}
