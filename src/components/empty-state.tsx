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
        className={`grid min-h-[300px] place-items-center content-center rounded-panel border border-dashed p-6 text-center shadow-(--glass-inset-shadow) [background:var(--glass-inset)] ${error ? "border-[#a3444c]" : "border-(--border-subtle)"}`}
        role={role}
      >
        {icon ? <span className="text-[2.125rem] text-(--brand-blue-text)" aria-hidden="true">{icon}</span> : null}
        <h2 className="mx-0 mt-3 mb-1 text-title">{title}</h2>
        <p className="m-0 text-small text-(--text-muted)">{children}</p>
      </div>
    );
  }

  return (
    <div className={`grid min-h-[250px] place-items-center content-center text-center ${error ? "text-(--status-error-text)" : "text-(--text-muted)"}`} role={role}>
      {icon ? (
        <span className="grid size-12 place-items-center rounded-full border border-(--border-shell) text-display text-(--brand-blue-text)" aria-hidden="true">{icon}</span>
      ) : null}
      <h3 className="mx-0 mt-[13px] mb-[3px] text-lead text-(--text-primary)">{title}</h3>
      <p className="m-0 max-w-[360px] text-caption">{children}</p>
    </div>
  );
}
