// Class names for activity-page buttons; usable on both <button> and <Link>.
const base = "transition-[filter,background-color] duration-160 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[5px] border px-5 text-center font-extrabold no-underline disabled:cursor-not-allowed disabled:opacity-55";

export const activityButton = {
  primary: `${base} not-disabled:hover:brightness-115 border-brand bg-brand text-white`,
  secondary: `${base} border-[#7d8794] light:border-(--border-strong) bg-(--surface-raised) not-disabled:hover:bg-[#2b3649] light:not-disabled:hover:bg-(--surface-sunken) text-(--text-primary)`,
  danger: `${base} border-[#ff5964] bg-[rgba(255,44,58,0.12)] not-disabled:hover:bg-[rgba(255,44,58,0.22)] text-[#ff7c85] light:text-(--status-error-text)`,
};
