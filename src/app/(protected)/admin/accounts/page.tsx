import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { AddAdministratorForm, ManageAccountForms, RemoveAdministratorForm } from "@/components/admin/administrator-forms";
import { reviewPanelClass } from "@/components/admin/review-styles";
import { badgeClass, button, field } from "@/components/controls";
import { PageHeading, PageMain, SectionHeading, countBadgeClass } from "@/components/dashboard-ui";
import { EmptyState } from "@/components/empty-state";
import { getAccounts, getPlatformAdmins } from "@/lib/admin/server";
import type { AccountProjection } from "@/lib/admin/types";
import { requirePlatformAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Accounts | ThoraxScan",
};

const filters = {
  all: () => true,
  student: (account: AccountProjection) => account.role === "student",
  professor: (account: AccountProjection) => account.role === "professor",
  admin: (account: AccountProjection) => account.is_admin,
  disabled: (account: AccountProjection) => account.disabled,
} as const;
type AccountFilter = keyof typeof filters;
const filterLabels: Record<AccountFilter, string> = { all: "All", student: "Students", professor: "Professors", admin: "Admins", disabled: "Disabled" };

function isFilter(value: string | undefined): value is AccountFilter {
  return Boolean(value && value in filters);
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function roleLabel(account: AccountProjection) {
  if (account.role === "student") return "Student";
  return account.professor_status === "approved" ? "Professor" : `Professor (${account.professor_status ?? "unknown"})`;
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const profile = await requirePlatformAdmin();
  const [accounts, administrators] = await Promise.all([getAccounts(), getPlatformAdmins()]);
  const { role, q } = await searchParams;
  const selected = isFilter(role) ? role : "all";
  const query = q?.trim().toLowerCase() ?? "";

  const visible = accounts.data.filter(
    (account) =>
      filters[selected](account) &&
      (!query || account.display_name.toLowerCase().includes(query) || account.email.toLowerCase().includes(query)),
  );

  return (
    <AdminShell activeItem="accounts">
      <PageMain>
        <PageHeading title="Accounts" subtitle="Update names, reset access, disable, or delete accounts when a user asks." />

        <section className={`${reviewPanelClass} p-6 max-[560px]:p-5`} aria-labelledby="accounts-title">
          <div className="mb-5"><SectionHeading kicker="User support" title="All accounts" titleId="accounts-title" aside={<span className={countBadgeClass}>{visible.length} shown</span>} /></div>

          <form className="grid gap-2.5" method="get">
            <label className="text-caption font-extrabold text-(--text-primary)" htmlFor="account-search">Search accounts</label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 max-[560px]:grid-cols-1">
              <input id="account-search" name="q" type="search" defaultValue={q} className={field} placeholder="Name or email" />
              <input type="hidden" name="role" value={selected} />
              <button className={button("primary")} type="submit">Search</button>
            </div>
          </form>

          <nav className="my-[18px] flex gap-2 overflow-x-auto pb-0.5" aria-label="Account filters">
            {(Object.keys(filters) as AccountFilter[]).map((filter) => (
              <Link
                key={filter}
                aria-current={selected === filter ? "page" : undefined}
                className={`transition-colors duration-160 whitespace-nowrap rounded-full border px-[14px] py-2 text-caption font-extrabold no-underline ${selected === filter ? "border-brand bg-[rgba(44,174,255,0.18)] text-(--text-primary)" : "border-(--border-subtle) text-(--text-secondary) hover:bg-(--hover-overlay)"}`}
                href={{ pathname: "/admin/accounts", query: { role: filter, ...(q ? { q } : {}) } }}
              >
                {filterLabels[filter]} <span className="ml-1 tabular-nums opacity-75">{accounts.data.filter(filters[filter]).length}</span>
              </Link>
            ))}
          </nav>

          {accounts.error ? (
            <EmptyState error role="alert" title="Accounts are unavailable">Refresh the page or try again later.</EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState icon="✓" title="No matching accounts">Try another name, email, or filter.</EmptyState>
          ) : (
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {visible.map((account) => (
                <li key={account.user_id} className="rounded-panel border border-(--border-shell) bg-(--glass-inset) px-[18px] py-3.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-[560px]:grid-cols-1">
                    <div className="min-w-0">
                      <p className="m-0 font-extrabold">{account.display_name}</p>
                      <p className="mt-[3px] truncate text-caption text-(--text-muted)">{account.email}</p>
                      <p className="mt-[3px] text-label text-(--text-muted)">
                        Joined {formatDate(account.created_at)} · Last sign-in {formatDate(account.last_sign_in_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`${badgeClass} text-(--text-secondary)`}>{roleLabel(account)}</span>
                      {account.is_admin ? <span className={`${badgeClass} text-(--status-warning-text)`}>Admin</span> : null}
                      {account.disabled ? <span className={`${badgeClass} text-(--status-error-text)`}>Disabled</span> : null}
                    </div>
                  </div>
                  {account.user_id === profile.id ? (
                    <p className="mt-2 mb-0 text-label text-(--text-muted)">This is you. Change your own account in Settings.</p>
                  ) : (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-caption font-extrabold text-(--brand-blue-text)">Manage account</summary>
                      <ManageAccountForms account={account} />
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${reviewPanelClass} mt-6 p-6 max-[560px]:p-5`} aria-labelledby="administrators-title">
          <div className="mb-5"><SectionHeading kicker="Platform access" title="Administrators" titleId="administrators-title" aside={<span className={countBadgeClass}>{administrators.data.length}</span>} /></div>
          {administrators.error ? (
            <EmptyState error role="alert" title="Administrators are unavailable">Refresh the page or try again later.</EmptyState>
          ) : (
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {administrators.data.map((administrator) => (
                <li key={administrator.user_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-panel border border-(--border-shell) bg-(--glass-inset) px-[18px] py-3.5 max-[560px]:grid-cols-1">
                  <div className="min-w-0">
                    <p className="m-0 font-extrabold">{administrator.display_name}</p>
                    <p className="mt-[3px] truncate text-caption text-(--text-muted)">{administrator.email}</p>
                    <p className="mt-[3px] text-label text-(--text-muted)">
                      Added {formatDate(administrator.created_at)}{administrator.created_by_name ? ` by ${administrator.created_by_name}` : ""}
                    </p>
                  </div>
                  {administrator.user_id === profile.id ? (
                    <span className={`${countBadgeClass} w-fit`}>You</span>
                  ) : (
                    <RemoveAdministratorForm userId={administrator.user_id} displayName={administrator.display_name} />
                  )}
                </li>
              ))}
            </ul>
          )}
          <AddAdministratorForm />
        </section>
      </PageMain>
    </AdminShell>
  );
}
