// Class names for the activity forms. Kept free of next/link so client forms (and their browser tests) don't load the router.
export function activityFormMessageClass(status: string) {
  const tone = status === "error" || status === "unauthorized" ? "bg-[rgba(255,55,69,0.1)] text-(--status-error-text)" : status === "success" ? "bg-[rgba(36,255,61,0.09)] text-(--status-success-text)" : "bg-[rgba(0,119,255,0.12)] text-(--brand-blue-text)";
  return `mx-0 mt-3 mb-0 rounded-[4px] px-[11px] py-[9px] text-[0.6875rem] leading-[1.4] ${tone}`;
}

export const activityFormHeadingClass = "mb-[17px] flex items-center gap-[13px]";
export const activityFormHeadingIconClass = "text-[1.9375rem] text-brand";
export const activityFormHeadingKickerClass = "mx-0 mt-0 mb-0.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-(--text-muted)";
export const activityFormHeadingTitleClass = "m-0 text-[1.875rem] max-[520px]:text-[1.5625rem]";
