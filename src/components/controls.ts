// The app's one button and field recipe; buttons work on both <button> and <Link>.
// md is 40px (44px at touch widths); lg is 48px for auth and landing calls to action.
const buttonBase = "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border text-center font-extrabold no-underline transition-[filter,background-color] duration-160 disabled:cursor-not-allowed disabled:opacity-55";
const buttonSizes = {
  md: "min-h-10 px-4 text-[0.875rem] max-[850px]:min-h-11",
  lg: "min-h-12 px-6 text-[1rem]",
};
const buttonVariants = {
  primary: "border-brand bg-brand text-white not-disabled:hover:brightness-115",
  secondary: "border-(--border-strong) bg-(--surface-raised) text-(--text-primary) not-disabled:hover:bg-(--surface-sunken)",
  danger: "border-[#ff5964] bg-[rgba(255,44,58,0.12)] text-(--status-error-text) not-disabled:hover:bg-[rgba(255,44,58,0.22)]",
};

export function button(variant: keyof typeof buttonVariants, size: keyof typeof buttonSizes = "md") {
  return `${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]}`;
}

// Inputs, selects and textareas. Disabled styling is left to each form: some fade, locked reviews stay readable.
const fieldBase = "w-full min-w-0 rounded-control border border-(--border-field) bg-(--surface-input) px-3 text-[0.875rem] text-(--text-primary) placeholder:text-(--text-muted) aria-invalid:border-(--status-error-text) [&[readonly]]:bg-(--surface-input-readonly) [&[readonly]]:text-(--text-muted)";
export const field = `${fieldBase} min-h-10`;
export const textarea = `${fieldBase} resize-y py-2.5 leading-[1.5]`;
