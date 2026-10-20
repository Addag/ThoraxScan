import type { ReviewStatus } from "@/lib/evaluations/types";

export const reviewSurfaceClass = "[background:var(--glass-surface)]";
export const reviewHeadingClass = "m-0 text-[16px] font-extrabold";
export const reviewCardClass = `${reviewSurfaceClass} border-[rgb(137_161_196/42%)] p-[18px]`;
export const reviewCardTitleClass = "mx-0 mt-0 mb-3.5 flex items-center gap-[9px] text-[16px] font-extrabold";
export const reviewFieldLabelClass = "grid gap-1.5 text-[11px] text-[#b7c5d9] light:text-(--text-muted)";
const reviewFieldBase = "rounded-[6px] border border-[#687b98] bg-[rgb(16_30_51/82%)] light:bg-(--surface-raised) px-2.5 py-2 text-(--text-primary) [font:inherit]";
export const reviewFieldClass = `${reviewFieldBase} min-h-[38px]`;
export const reviewTextareaClass = `${reviewFieldBase} min-h-[110px] resize-y`;
export const reviewButtonBase = "min-h-[38px] cursor-pointer rounded-[7px] px-4 py-0 font-extrabold";
export const reviewButtonSolid = `${reviewButtonBase} transition-[filter] duration-160 not-disabled:hover:brightness-115 border-0 bg-[#087fff] text-white`;
export const reviewButtonGradient = `${reviewButtonBase} transition-[filter] duration-160 not-disabled:hover:brightness-115 border-0 [background:linear-gradient(135deg,#148cff,#006be8)] shadow-[0_7px_18px_rgb(0_119_255/24%)] text-white`;
export const reviewButtonOutline = `${reviewButtonBase} transition-colors duration-160 not-disabled:hover:bg-(--hover-overlay) border border-[#627997] bg-transparent text-[#d6e4f8] light:text-(--text-secondary)`;
export const reviewLinkClass = "transition-colors duration-160 hover:text-(--text-primary) text-[12px] text-[#9fcfff] light:text-(--brand-blue-text) no-underline";
export const reviewPanelTextClass = "mx-0 mt-0 mb-3 text-[12px] leading-[1.5] text-[#b7c5d9] light:text-(--text-muted)";

const statusColors = { unreviewed: "text-[#ffd36a] light:text-(--status-warning-text)", draft: "text-[#8fc8ff] light:text-(--brand-blue-text)", released: "text-[#7dff8c] light:text-(--status-success-text)" };
export function evaluationStatusClass(status?: ReviewStatus) {
  return `rounded-[999px] border border-current px-[9px] py-[5px] font-extrabold capitalize ${status ? `text-[10px] ${statusColors[status]}` : "text-[12px]"}`;
}

export function reviewAvatarClass(size: "normal" | "large" = "normal") {
  return `grid place-items-center rounded-full bg-[#087fff] font-extrabold text-white ${size === "large" ? "size-[46px]" : "size-[38px]"}`;
}
