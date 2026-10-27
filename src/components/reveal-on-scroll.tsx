"use client";

import { useEffect } from "react";

// Play-once fade-up for the landing page's [data-reveal] elements (styles in globals.css). Elements that reach the screen
// together are staggered 120ms apart, so a row of cards cascades while a single-column phone layout gets no extra wait.
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (!root) return;
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        const el = entry.target as HTMLElement;
        el.style.transitionDelay = `${index * 120}ms`;
        el.setAttribute("data-shown", "");
        observer.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    root.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    root.setAttribute("data-reveal-ready", "");
    return () => observer.disconnect();
  }, []);
  return null;
}
