/**
 * Applies the saved theme, text size and contrast to <html>. app/layout.tsx stringifies this into an inline
 * script that runs before first paint, so it must stay self-contained: browser globals only, no imports.
 */
export function applySavedDisplayPrefs() {
  try {
    const root = document.documentElement;
    if (localStorage.getItem("theme") === "light") root.setAttribute("data-theme", "light");
    const textSize = localStorage.getItem("text-size");
    if (textSize === "large" || textSize === "larger") root.setAttribute("data-text-size", textSize);
    const contrast = localStorage.getItem("contrast");
    // With no saved choice, follow the OS "increase contrast" setting, as reduced motion already does.
    if (contrast === "high" || (contrast === null && matchMedia("(prefers-contrast: more)").matches)) root.setAttribute("data-contrast", "high");
  } catch {}
}
