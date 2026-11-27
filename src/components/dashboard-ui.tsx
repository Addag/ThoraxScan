import type { ReactNode } from "react";
import Link from "next/link";

export const glassPanelClass =
  "rounded-panel border [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";
export const sectionKickerClass =
  "mx-0 mt-0 mb-[5px] text-label font-extrabold uppercase leading-snug tracking-[0.08em] text-(--brand-blue-text)";
export const countBadgeClass =
  "rounded-full border border-(--border-shell) px-2.5 py-1.5 text-label text-(--text-muted)";
export const backLinkClass =
  "transition-colors duration-160 hover:text-(--text-primary) mb-3 inline-block text-small font-extrabold text-(--brand-blue-text) no-underline";
export const listEmptyClass = "mx-0 mt-3.5 mb-0 text-label text-(--text-muted)";

export function PageMain({
  children,
  width = "w-[min(1120px,calc(100%-44px))] max-[600px]:w-[min(100%-28px,1120px)]",
  top = "pt-7 max-[600px]:pt-[22px]",
  bottom = "pb-[52px]",
}: {
  children: ReactNode;
  width?: string;
  top?: string;
  bottom?: string;
}) {
  return <main className={`mx-auto flex flex-1 flex-col outline-none ${width} ${top} ${bottom}`} id="main-content" tabIndex={-1}>{children}</main>;
}

export function formStatusColor(status: string) {
  if (status === "success") return "text-(--status-success-text)";
  if (status === "expired" || status === "revoked") return "text-(--status-warning-text)";
  return "text-(--status-error-text)";
}

// The one page header: optional back link, title, subtitle, and today's date aligned to the subtitle.
export function PageHeading({
  title,
  subtitle,
  back,
  showDate = true,
}: {
  title: string;
  subtitle: string;
  back?: { href: string; label: string };
  showDate?: boolean;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-6 max-[760px]:flex-col max-[760px]:items-start">
      <div>
        {back ? <Link className={backLinkClass} href={back.href}>← {back.label}</Link> : null}
        <h1 className="m-0 text-page leading-[1.1]">{title}</h1>
        <p className="mt-1.5 mb-0 text-small leading-snug text-(--text-muted)">{subtitle}</p>
      </div>
      {showDate && (
        <time className="flex-none max-[760px]:hidden rounded-control bg-[rgba(85,85,85,0.7)] light:bg-(--surface-sunken) px-3.5 py-2 text-caption text-(--text-primary)" dateTime={new Date().toISOString().slice(0, 10)}>
          {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}
        </time>
      )}
    </div>
  );
}

export function SectionHeading({
  kicker,
  title,
  titleId,
  aside,
}: {
  kicker: string;
  title: string;
  titleId?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-(--border-strong) pb-[18px] max-[600px]:items-start">
      <div>
        <p className={sectionKickerClass}>{kicker}</p>
        <h2 className="m-0 text-title" id={titleId}>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  // One row on desktop whatever the count (4 on Home, 5 on Analytics); two per row on phones.
  return <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-4">{children}</section>;
}

export function StatCard({
  symbol,
  value,
  label,
  detail,
}: {
  symbol: string;
  value: number | string;
  label: string;
  detail: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-panel border border-(--border-shell) bg-(--glass-inset) p-4 shadow-(--glass-inset-shadow)">
      <span className="grid size-10 place-items-center rounded-control bg-white font-extrabold text-[#2d264b]" aria-hidden="true">{symbol}</span>
      <strong className="absolute top-4 right-4 font-brand text-[clamp(1.75rem,3vw,2.625rem)] leading-none text-(--brand-blue-text)">{value}</strong>
      <p className="mt-5 mb-0.5 text-body font-extrabold">{label}</p>
      <small className="text-label leading-snug text-(--text-muted)">{detail}</small>
    </article>
  );
}

export function WorkspaceCard({
  role,
  name,
  detail,
  href,
  linkLabel,
  minHeight = 210,
}: {
  role: string;
  name: string;
  detail: string;
  href: string;
  linkLabel: string;
  minHeight?: 205 | 210;
}) {
  return (
    <article className={`relative ${minHeight === 205 ? "min-h-[205px]" : "min-h-[210px]"} overflow-hidden rounded-panel border border-(--border-shell) bg-(--glass-inset) p-5 shadow-(--glass-inset-shadow)`}>
      <div className="grid size-10 place-items-center rounded-control bg-white font-brand font-extrabold text-[#2d264b]" aria-hidden="true">W</div>
      <p className="mt-[18px] mb-[3px] text-label font-extrabold uppercase leading-snug tracking-[0.08em] text-(--brand-blue-text)">{role}</p>
      <h3 className="m-0 mb-[5px] overflow-hidden text-title text-ellipsis whitespace-nowrap">{name}</h3>
      <span className="text-label leading-snug text-(--text-muted)">{detail}</span>
      <Link className="absolute right-5 bottom-[18px] text-small font-extrabold text-(--text-primary) no-underline hover:text-(--brand-blue-text)" href={href}>{linkLabel} <span aria-hidden="true">→</span></Link>
    </article>
  );
}
