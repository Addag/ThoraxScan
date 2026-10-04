// Class names for the activity forms. Kept free of next/link so client forms (and their browser tests) don't load the router.
export function activityFormMessageClass(status: string) {
  const tone = status === "error" || status === "unauthorized" ? "bg-[rgba(255,55,69,0.1)] text-[#ff9299]" : status === "success" ? "bg-[rgba(36,255,61,0.09)] text-[#7dff8c]" : "bg-[rgba(0,119,255,0.12)] text-[#9fcfff]";
  return `mx-0 mt-3 mb-0 rounded-[4px] px-[11px] py-[9px] text-[11px] leading-[1.4] ${tone}`;
}

export const activityFormHeadingClass = "mb-[17px] flex items-center gap-[13px]";
export const activityFormHeadingIconClass = "text-[31px] text-brand";
export const activityFormHeadingKickerClass = "mx-0 mt-0 mb-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8e96a4]";
export const activityFormHeadingTitleClass = "m-0 text-[30px] max-[520px]:text-[25px]";
