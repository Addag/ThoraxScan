import Image from "next/image";
import Link from "next/link";

const variants = {
  landing: {
    link: "absolute top-[13px] left-9 z-[2] gap-[26px] max-[1024px]:top-[11px] max-[1024px]:left-5 max-[1024px]:gap-3.5",
    mark: "size-[59px] max-[1024px]:size-[49px]",
    name: "text-[32px] tracking-[-1.5px] max-[1024px]:text-[27px]",
  },
  auth: {
    link: "absolute top-[65px] left-9 z-[2] gap-[26px] max-[1024px]:static max-[1024px]:mb-12",
    mark: "size-[59px]",
    name: "text-[32px] tracking-[-1.5px]",
  },
  sidebar: {
    link: "static mx-1 mt-0 mb-7 gap-2.5 max-[850px]:m-0 max-[850px]:self-start",
    mark: "size-[42px] max-[850px]:size-9",
    name: "text-[23px] tracking-[-1px] max-[850px]:text-[clamp(19px,5vw,23px)]",
  },
} as const;

export function Brand({ variant }: { variant: keyof typeof variants }) {
  const styles = variants[variant];

  return (
    <Link className={`inline-flex items-center text-foreground no-underline ${styles.link}`} href="/" aria-label="ThoraxScan home">
      <Image
        className={`block object-cover ${styles.mark}`}
        src="/images/thoraxscan-logo.png"
        alt=""
        width={59}
        height={59}
        priority
      />
      <span className={`-mt-0.5 [font-family:var(--font-inter),Arial,sans-serif] font-extrabold leading-[1.2] ${styles.name}`}>
        Thorax<span className="text-brand">Scan</span>
      </span>
    </Link>
  );
}
