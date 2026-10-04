import type { ReactNode } from "react";
import Link from "next/link";

export const glassPanelClass =
  "rounded-[10px] border [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";
export const sectionKickerClass =
  "mx-0 mt-0 mb-[5px] text-[10px] font-extrabold uppercase leading-[1.4] tracking-[0.08em] text-[#5fa8fb]";
export const countBadgeClass =
  "rounded-[999px] border border-[#4d5b74] px-2.5 py-1.5 text-[11px] text-[#b9c2d6]";
export const backLinkClass =
  "mb-5 inline-block text-[13px] font-extrabold text-[#9fcfff] no-underline";
export const listEmptyClass = "mx-0 mt-3.5 mb-0 text-[11px] text-[#8993a8]";

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
  return <main className={`mx-auto flex flex-1 flex-col ${width} ${top} ${bottom}`}>{children}</main>;
}

export function formStatusColor(status: string) {
  if (status === "success") return "text-[#b8f3ce]";
  if (status === "expired" || status === "revoked") return "text-[#ffd59a]";
  return "text-[#ffb4b4]";
}

export function PageHeading({
  title,
  subtitle,
  showDate = true,
}: {
  title: string;
  subtitle: string;
  showDate?: boolean;
}) {
  return (
    <div className="mb-[26px] flex items-start justify-between gap-7 max-[600px]:block">
      <div>
        <h1 className="m-0 text-[clamp(28px,4vw,38px)] leading-[1.1]">{title}</h1>
        <p className="mt-[5px] mb-0 text-[13px] text-(--text-muted)">{subtitle}</p>
      </div>
      {showDate && (
        <time className="rounded-[4px] bg-[rgba(85,85,85,0.7)] px-[15px] py-2.5 text-[11px] text-white max-[600px]:mt-[15px] max-[600px]:inline-block" dateTime={new Date().toISOString().slice(0, 10)}>
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
    <div className="flex items-center justify-between gap-6 border-b border-[rgba(172,172,172,0.55)] pb-[18px] max-[600px]:items-start">
      <div>
        <p className={sectionKickerClass}>{kicker}</p>
        <h2 className="m-0 text-[20px]" id={titleId}>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <section className="grid grid-cols-2 gap-[18px] max-[700px]:grid-cols-1">{children}</section>;
}

export function StatCard({
  symbol,
  value,
  label,
  detail,
}: {
  symbol: string;
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <article className="relative min-h-[155px] overflow-hidden rounded-[10px] border border-[#33425c] bg-(--glass-inset) px-[22px] py-[18px] shadow-(--glass-inset-shadow)">
      <span className="grid size-[43px] place-items-center rounded-[5px] bg-white font-extrabold text-[#2d264b]" aria-hidden="true">{symbol}</span>
      <strong className="absolute top-[18px] right-6 font-(--font-inter) text-[42px] leading-none text-[#65b8ff]">{value}</strong>
      <p className="mt-[31px] mb-0.5 text-[14px] font-extrabold">{label}</p>
      <small className="text-[11px] leading-[1.4] text-[rgba(167,167,167,0.72)]">{detail}</small>
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
    <article className={`relative ${minHeight === 205 ? "min-h-[205px]" : "min-h-[210px]"} overflow-hidden rounded-[9px] border border-[#3d4c67] bg-(--glass-inset) p-5 shadow-(--glass-inset-shadow)`}>
      <div className="grid size-[42px] place-items-center rounded-[7px] bg-white font-(--font-inter) font-extrabold text-[#2d264b]" aria-hidden="true">W</div>
      <p className="mt-[18px] mb-[3px] text-[10px] font-extrabold uppercase leading-[1.4] tracking-[0.07em] text-[#6faef7]">{role}</p>
      <h3 className="m-0 mb-[5px] overflow-hidden text-[19px] text-ellipsis whitespace-nowrap">{name}</h3>
      <span className="text-[11px] leading-[1.4] text-[#8992a8]">{detail}</span>
      <Link className="absolute right-5 bottom-[18px] text-[13px] font-extrabold text-white no-underline hover:text-[#7fc3ff]" href={href}>{linkLabel} <span aria-hidden="true">→</span></Link>
    </article>
  );
}
