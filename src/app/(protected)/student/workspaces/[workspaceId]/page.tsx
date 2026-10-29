import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";
import { getStudentWorkspace } from "@/lib/workspaces/server";
import { backLinkClass, glassPanelClass, sectionKickerClass , PageMain} from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "Workspace | ThoraxScan",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StudentWorkspacePage({
  params,
}: PageProps<"/student/workspaces/[workspaceId]">) {
  const profile = await requireRole("student");
  const { workspaceId } = await params;

  if (!uuidPattern.test(workspaceId)) notFound();

  const workspace = await getStudentWorkspace(profile.id, workspaceId);
  if (!workspace) notFound();

  return (
    <StudentShell>
      <PageMain>
        <Link className={backLinkClass} href="/student">← Back to home</Link>
        <section className={`${glassPanelClass} border-(--border-shell) p-[clamp(28px,5vw,52px)]`}>
          <p className={sectionKickerClass}>Student workspace</p>
          <h1 className="m-0 text-[clamp(1.75rem,4vw,2.375rem)] leading-[1.1]">{workspace.name}</h1>
          <p className="mt-3.5 mb-8 max-w-[640px] leading-[1.6] text-(--text-muted)">
            Review published chest X-ray learning activities from this workspace.
          </p>
          <dl className="grid grid-cols-2 gap-3.5 max-[600px]:grid-cols-1">
            <div className="rounded-panel border border-(--border-shell) bg-(--surface-sunken) p-4"><dt className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-(--brand-blue-text)">Your access</dt><dd className="mt-[5px] text-[0.875rem]">Student · Read only</dd></div>
            <div className="rounded-panel border border-(--border-shell) bg-(--surface-sunken) p-4">
              <dt className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-(--brand-blue-text)">Joined</dt>
              <dd className="mt-[5px] text-[0.875rem]">{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(workspace.joined_at))}</dd>
            </div>
          </dl>
        </section>
        <section className={`${glassPanelClass} mt-6 border-(--border-shell) flex items-center gap-5 p-6 max-[600px]:flex-col max-[600px]:items-start`}>
          <span className="text-[2.25rem] text-(--brand-blue-text)" aria-hidden="true">▣</span>
          <div>
            <h2 className="m-0 text-[1.25rem]">Workspace activities</h2>
            <p className="mt-[5px] mb-0 text-[0.75rem] text-(--text-muted)">Published assignments are available from the Activities page.</p>
            <Link className="transition-colors duration-160 hover:text-(--text-primary) mt-2 inline-block text-[0.75rem] font-extrabold text-(--brand-blue-text) no-underline" href="/student/activities">Browse activities <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </PageMain>
    </StudentShell>
  );
}
