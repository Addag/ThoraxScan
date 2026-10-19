import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(protected)/actions";
import { AppSidebar } from "@/components/app-sidebar";

export type NavItem = {
  label: string;
  href?: string;
  /** File name in /images/menu-icons, without the extension. */
  icon?: string;
  /** Text glyph shown when there is no image icon. */
  glyph?: string;
  note?: string;
  active?: boolean;
  disabled?: boolean;
};

const navLinkClass = "transition-colors duration-160 relative grid min-h-[46px] grid-cols-[25px_minmax(0,1fr)] items-center rounded-lg border px-2.5 py-2 text-[13px] no-underline max-[850px]:min-h-12 max-[850px]:gap-x-2.5 max-[850px]:text-[15px]";
const activeNavLinkClass = "border-brand bg-[rgba(44,174,255,0.21)] before:absolute before:top-2.5 before:bottom-2.5 before:-left-[7px] before:w-[3px] before:rounded-lg before:bg-brand";
const supportingTextClass = "leading-[1.4]";

function NavEntry({ item }: { item: NavItem }) {
  const className = `${navLinkClass} ${item.active ? activeNavLinkClass : "border-transparent hover:bg-white/8"} ${item.disabled ? "text-[#c1cee0]" : "text-white"}`;
  const content = (
    <>
      {item.icon ? (
        <Image className="block size-6 flex-[0_0_24px] object-contain" src={`/images/menu-icons/${item.icon}.png`} alt="" width={24} height={24} aria-hidden="true" />
      ) : item.glyph ? (
        <span className={`text-[20px] ${item.disabled ? "text-[#c1cee0]" : "text-white"}`} aria-hidden="true">{item.glyph}</span>
      ) : null}
      {item.icon || item.glyph ? " " : null}{item.label}
      {item.note ? <> <small className={`col-start-2 text-[9px] text-[#c1cee0] max-[850px]:text-[12px] ${supportingTextClass}`}>{item.note}</small></> : null}
    </>
  );

  return item.href ? (
    <Link aria-current={item.active ? "page" : undefined} className={className} href={item.href}>{content}</Link>
  ) : (
    <span className={className}>{content}</span>
  );
}

export function AppShell({
  children,
  accessLabel,
  accessValue,
  accessTone = "ok",
  navLabel,
  navAriaLabel,
  navItems,
  sectionLabel,
  sectionDescription,
  footerNotes,
}: {
  children: ReactNode;
  accessLabel: string;
  accessValue: string;
  accessTone?: "ok" | "warning";
  navLabel: string;
  navAriaLabel: string;
  navItems: NavItem[];
  sectionLabel: string;
  sectionDescription: string;
  footerNotes: [string, string];
}) {
  return (
    <div className="grid min-h-svh grid-cols-[230px_minmax(0,1fr)] bg-(--app-background) text-foreground max-[850px]:block">
      <a className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[8px] focus:bg-[#0a65bd] focus:px-4 focus:py-3 focus:font-extrabold focus:text-white" href="#main-content">Skip to main content</a>
      <AppSidebar>
        <div className="flex min-h-[68px] flex-col justify-center gap-[9px] rounded-[10px] border border-brand px-3.5 py-2.5 shadow-(--glass-inset-shadow) [background:var(--glass-inset)]">
          <span className={`m-0 text-[10px] font-extrabold tracking-[0.08em] text-[#5fa8fb] uppercase ${supportingTextClass}`}>{accessLabel}</span>
          <strong className="text-[13px]">
            <i
              className={`mr-1.5 inline-block size-[7px] rounded-full ${accessTone === "ok" ? "bg-[#46ff2d] shadow-[0_0_10px_rgba(70,255,45,0.75)]" : "bg-[#ffce4b] shadow-[0_0_10px_rgba(255,206,75,0.7)]"}`}
              aria-hidden="true"
            /> {accessValue}
          </strong>
        </div>
        <p className={`mx-1.5 mt-[22px] mb-2 text-[10px] font-extrabold tracking-[0.08em] text-[#c1cee0] uppercase ${supportingTextClass}`}>{navLabel}</p>
        <nav className="flex flex-col gap-1.5" aria-label={navAriaLabel}>
          {navItems.map((item) => <NavEntry item={item} key={item.label} />)}
        </nav>
        <form className="mt-auto border-t border-t-[rgba(114,112,112,0.64)] pt-[18px] max-[850px]:mt-4 max-[850px]:pt-3" action={logoutAction}>
          <button className="transition-colors duration-160 not-disabled:hover:bg-white/8 w-full cursor-pointer border-0 bg-transparent p-2.5 text-left font-semibold text-[#ff5457] max-[850px]:min-h-12" type="submit">
            <span className="mr-2 text-[20px]" aria-hidden="true">↪</span> Log out
          </button>
        </form>
      </AppSidebar>
      <div className="flex min-h-svh min-w-0 flex-col">
        <header className="flex min-h-20 items-center border-b border-b-[#33425c] bg-(--glass-shell) px-[clamp(22px,4vw,54px)] backdrop-blur-[12px] max-[850px]:hidden">
          <div className="flex flex-col gap-1">
            <strong className="text-[13px]">{sectionLabel}</strong>
            <span className={`text-[12px] text-[#b7b7b7] ${supportingTextClass}`}>{sectionDescription}</span>
          </div>
        </header>
        {children}
        <footer className="flex min-h-[42px] items-center justify-between gap-5 border-t border-t-[rgba(255,255,255,0.12)] bg-(--glass-shell) px-[clamp(22px,4vw,54px)] py-2.5 text-[11px] backdrop-blur-[12px] max-[850px]:flex-wrap max-[600px]:hidden">
          <strong>ThoraxScan · v1.0.0 Prototype</strong>
          <span className={`text-[12px] text-[#b8b8b8] ${supportingTextClass}`}>{footerNotes[0]}</span>
          <span className={`text-[12px] text-[#b8b8b8] ${supportingTextClass}`}>{footerNotes[1]}</span>
          <span className="flex items-center gap-3">
            <Link className="text-[12px] font-semibold text-[#d6e1f0] underline underline-offset-2" href="/privacy-policy">Privacy Policy</Link>
            <Link className="text-[12px] font-semibold text-[#d6e1f0] underline underline-offset-2" href="/terms">Terms</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
