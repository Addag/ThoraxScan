import type { ReactNode } from "react";

/**
 * "plain" sits inside an existing panel (dashboards); "card" stands alone on activity pages.
 */
export function EmptyState({
  variant = "plain",
  error = false,
  role,
  icon,
  title,
  children,
}: {
  variant?: "plain" | "card";
  error?: boolean;
  role?: "alert";
  icon?: string;
  title: string;
  children: ReactNode;
}) {
  if (variant === "card") {
    return (
      <div
        className={`grid min-h-[300px] place-items-center content-center rounded-[10px] border border-dashed p-[30px] text-center shadow-(--glass-inset-shadow) [background:var(--glass-inset)] ${error ? "border-[#a3444c]" : "border-[#536079] light:border-(--border-subtle)"}`}
        role={role}
      >
        {icon ? <span className="text-[34px] text-[#55afff] light:text-(--brand-blue-text)" aria-hidden="true">{icon}</span> : null}
        <h2 className="mx-0 mt-3 mb-1 text-[21px]">{title}</h2>
        <p className="m-0 text-[13px] text-[#8d96a5] light:text-(--text-muted)">{children}</p>
      </div>
    );
  }

  return (
    <div className={`grid min-h-[250px] place-items-center content-center text-center ${error ? "text-[#ffb4b4] light:text-(--status-error-text)" : "text-[#9ba2b8] light:text-(--text-muted)"}`} role={role}>
      {icon ? (
        <span className="grid size-[50px] place-items-center rounded-full border border-[#4b5a76] text-[26px] text-[#6faef7] light:text-(--brand-blue-text)" aria-hidden="true">{icon}</span>
      ) : null}
      <h3 className="mx-0 mt-[13px] mb-[3px] text-[17px] text-(--text-primary)">{title}</h3>
      <p className="m-0 max-w-[360px] text-[12px]">{children}</p>
    </div>
  );
}
