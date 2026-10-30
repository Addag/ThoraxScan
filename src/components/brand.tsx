import Image from "next/image";
import Link from "next/link";

// The wordmark stays px, unlike other text: it sits beside a fixed-size logo image and would overflow the 230px sidebar at larger text sizes.
const variants = {
  landing: {
    link: "gap-[26px] narrow:gap-3.5",
    mark: "size-[59px] narrow:size-[49px]",
    name: "text-[32px] tracking-[-1.5px] narrow:text-[27px]",
  },
  auth: {
    link: "self-start gap-[26px] narrow:gap-3.5",
    mark: "size-[59px]",
    name: "text-[32px] tracking-[-1.5px]",
  },
  sidebar: {
    link: "static mx-1 mt-0 mb-7 gap-2.5 max-[850px]:m-0 max-[850px]:min-w-0",
    mark: "size-[42px] max-[850px]:size-9",
    // Below 360px the wordmark can't fit beside the mobile bar's three buttons; the logo remains.
    name: "text-[23px] tracking-[-1px] max-[850px]:text-[clamp(19px,5vw,23px)] max-[359px]:sr-only",
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
        preload
      />
      <span className={`-mt-0.5 [font-family:var(--font-inter),Arial,sans-serif] font-extrabold leading-[1.2] ${styles.name}`}>
        Thorax<span className="text-brand">Scan</span>
      </span>
    </Link>
  );
}
