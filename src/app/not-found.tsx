import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { primaryPill, secondaryPill } from "@/components/landing-ui";

export const metadata: Metadata = {
  title: "Page not found | ThoraxScan",
};

// Unmatched URLs and notFound() calls. Next.js ships this with every route, so it stays a Server Component with plain links.
export default function NotFound() {
  return (
    <div data-theme="dark" data-landing className="flex min-h-svh flex-col">
      <header className="flex h-[81px] items-center px-9 narrow:h-[73px] narrow:px-5">
        <Brand variant="landing" />
      </header>
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <p className="m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[clamp(4rem,12vw,6rem)] font-extrabold leading-none tracking-[-3px] text-brand">404</p>
        <h1 className="m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[-1px] text-(--text-primary)">This page isn&apos;t here</h1>
        <p className="m-0 text-[1.0625rem] font-semibold leading-[1.5] text-[#c3d0e2]">
          The link may be old or mistyped, or the activity or workspace may have been removed. If a professor sent you this link, ask them for a new one.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Link className={primaryPill} href="/dashboard">Go to your dashboard</Link>
          <Link className={secondaryPill} href="/">ThoraxScan home</Link>
        </div>
      </main>
    </div>
  );
}
