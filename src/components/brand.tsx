import Image from "next/image";
import Link from "next/link";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link className={`brand ${className}`.trim()} href="/" aria-label="ThoraxScan home">
      <Image
        className="brand-mark"
        src="/images/thoraxscan-logo.png"
        alt=""
        width={59}
        height={59}
        priority
      />
      <span className="brand-name">
        Thorax<span>Scan</span>
      </span>
    </Link>
  );
}
