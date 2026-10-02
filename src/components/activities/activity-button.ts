// Class names for activity-page buttons; usable on both <button> and <Link>.
const base = "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[5px] border px-5 text-center font-extrabold no-underline disabled:cursor-not-allowed disabled:opacity-55";

export const activityButton = {
  primary: `${base} border-brand bg-brand text-white`,
  secondary: `${base} border-[#7d8794] bg-[#202938] text-white`,
  danger: `${base} border-[#ff5964] bg-[rgba(255,44,58,0.12)] text-[#ff7c85]`,
};
