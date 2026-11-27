import { badgeClass } from "@/components/controls";
import type { ReviewStatus } from "@/lib/evaluations/types";

export const reviewSurfaceClass = "rounded-panel border [background:var(--glass-surface)] shadow-(--glass-shadow)";
export const reviewHeadingClass = "m-0 text-lead font-extrabold";
export const reviewCardClass = `${reviewSurfaceClass} border-(--border-shell) p-4`;
export const reviewCardTitleClass = "mx-0 mt-0 mb-3.5 flex items-center gap-[9px] text-lead font-extrabold";
export const reviewFieldLabelClass = "grid gap-1.5 text-label text-(--text-muted)";
export const reviewLinkClass = "transition-colors duration-160 hover:text-(--text-primary) text-caption text-(--brand-blue-text) no-underline";
export const reviewPanelTextClass = "mx-0 mt-0 mb-3 text-caption leading-normal text-(--text-muted)";

const statusColors = { unreviewed: "text-(--status-warning-text)", draft: "text-(--brand-blue-text)", released: "text-(--status-success-text)" };
export function evaluationStatusClass(status?: ReviewStatus) {
  return `${badgeClass} ${status ? statusColors[status] : ""}`;
}

export function reviewAvatarClass(size: "normal" | "large" = "normal") {
  return `grid place-items-center rounded-full bg-brand font-extrabold text-white ${size === "large" ? "size-12" : "size-10"}`;
}
