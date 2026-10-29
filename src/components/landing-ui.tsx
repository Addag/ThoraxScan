import Link from "next/link";

import { Brand } from "@/components/brand";

// Shared by the landing page (/) and its technical overview and docs sections.
export const sectionShell = "mx-auto max-w-[1200px] px-[clamp(16px,5vw,72px)] py-[clamp(64px,9vw,120px)]";
export const sectionTitle = "m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-1.2px] leading-[1.15] text-(--text-primary)";
export const sectionLead = "mt-4 mb-0 max-w-[640px] text-[1.0625rem] font-semibold leading-[1.5] text-[#c3d0e2]";
export const glassCard = "rounded-[22px] border border-[rgb(175_207_255/32%)] [background:var(--glass-surface)] shadow-(--glass-shadow)";
export const secondaryPill = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[rgb(168_211_255/48%)] px-6 text-[1rem] font-semibold text-[#e7f1ff] no-underline [background:linear-gradient(135deg,rgb(43_65_105/78%),rgb(10_24_49/72%))] shadow-(--glass-inset-shadow) backdrop-blur-[12px] [transition:border-color_160ms_ease,transform_160ms_ease] hover:border-[rgb(168_211_255/85%)] active:translate-y-px no-backdrop:[background:#14243e]";

// In-page jumps; the brand links back to the top.
const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#technical", label: "Technical" },
  { href: "#docs", label: "Docs" },
] as const;

export function LandingHeader() {
  return (
    <header className="relative h-[81px] bg-(--glass-shell) backdrop-blur-[12px] shadow-[inset_0_-1px_0_rgb(255_255_255/8%)] narrow:h-[73px] no-backdrop:[background:#14243e]">
      <Brand variant="landing" />
      <nav className="absolute top-1/2 right-9 flex -translate-y-1/2 gap-1 narrow:right-5" aria-label="On this page">
        {navLinks.map((link) => (
          // Phones keep only Docs beside the brand; the hero's button reaches How it works and the footer links Technical.
          <a
            className={`rounded-panel px-3.5 py-2 text-[0.9375rem] font-semibold text-[#c3d0e2] no-underline hover:bg-[rgb(92_155_255/20%)] hover:text-[#e7f1ff] ${link.href === "#docs" ? "" : "max-[480px]:hidden"}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <span className="absolute inset-x-0 bottom-0 block h-px w-full [background:url('/images/header-divider.svg')_center/100%_1px_no-repeat]" aria-hidden="true" />
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgb(255_255_255/8%)] px-[clamp(16px,5vw,72px)] py-6">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[0.8125rem] font-semibold text-(--text-muted)">
        <p className="m-0">ThoraxScan · For guided learning only, not for clinical diagnosis or patient care.</p>
        <span className="flex gap-4 text-[#d6e1f0] underline underline-offset-2">
          <a href="#technical">Technical</a>
          <a href="#docs">Docs</a>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
        </span>
      </div>
    </footer>
  );
}
