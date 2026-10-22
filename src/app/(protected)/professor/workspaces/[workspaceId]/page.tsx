import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  InvitationCreateForm,
  LeaveWorkspaceForm,
  RemoveMemberButton,
  RenameWorkspaceForm,
  RevokeInvitationButton,
} from "@/components/professor/professor-forms";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";
import type { InvitationCode } from "@/lib/workspaces/types";
import { getProfessorWorkspace } from "@/lib/workspaces/server";
import { activityButton } from "@/components/activities/activity-button";
import { backLinkClass, listEmptyClass, sectionKickerClass , PageMain} from "@/components/dashboard-ui";

export const metadata: Metadata = {
  title: "Manage workspace | ThoraxScan",
};

const panelBase = "rounded-[10px] border [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";
const panelHeadingClass = "flex items-center justify-between gap-5 border-b border-[rgba(172,172,172,0.45)] light:border-(--border-strong) pb-4";
const sectionTitleClass = "m-0 text-[1.1875rem]";
const columnHeadingClass = "mx-0 mt-0 mb-2.5 text-[0.75rem] text-[#b9c2d6] light:text-(--text-muted) uppercase";
const listResetClass = "m-0 list-none p-0";
const avatarClass = "grid size-[34px] place-items-center rounded-full border border-[#5177a4] bg-[rgba(0,119,255,0.2)] font-extrabold text-[#b8ddff] light:text-(--brand-blue-text)";
const memberRowClass = "grid min-h-[58px] grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-[rgba(93,107,133,0.35)] py-2";
const memberNameClass = "overflow-hidden text-[0.75rem] text-ellipsis whitespace-nowrap";
const memberDetailClass = "flex min-w-0 flex-col gap-[3px]";
const accessItemClass = "relative pl-[18px] text-[0.6875rem] leading-[1.45] text-[#aeb6c8] light:text-(--text-muted) before:absolute before:top-[3px] before:left-0 before:text-[#45aaff] light:before:text-(--brand-blue-text) before:content-['✓']";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invitationStatus(invitation: InvitationCode) {
  if (!invitation.is_active) return "Revoked";
  if (new Date(invitation.expires_at).getTime() <= Date.now()) return "Expired";
  if (invitation.uses_count >= invitation.max_uses) return "Used up";
  return "Active";
}

function InvitationList({
  invitations,
  canRevoke,
}: {
  invitations: InvitationCode[];
  canRevoke: boolean;
}) {
  if (invitations.length === 0) {
    return <p className={listEmptyClass}>No invitation history yet.</p>;
  }

  return (
    <ul className={`${listResetClass} flex max-h-[300px] flex-col gap-2 overflow-y-auto`}>
      {invitations.map((invitation) => {
        const status = invitationStatus(invitation);
        return (
          <li className="flex min-h-[55px] items-center justify-between gap-4 rounded-[7px] border border-[#3d4c67] bg-[rgba(4,8,40,0.3)] p-[10px_12px]" key={invitation.id}>
            <div className={memberDetailClass}>
              <strong className="text-[0.6875rem] text-[#b7ddff] light:text-(--brand-blue-text)">{status}</strong>
              <span className="text-[0.625rem] text-[#8f99ad] light:text-(--text-muted)">
                {invitation.uses_count}/{invitation.max_uses} uses · expires{" "}
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                  new Date(invitation.expires_at),
                )}
              </span>
            </div>
            {canRevoke && status === "Active" && (
              <RevokeInvitationButton invitationId={invitation.id} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function ProfessorWorkspacePage({
  params,
}: PageProps<"/professor/workspaces/[workspaceId]">) {
  const profile = await requireRole("professor");
  const { workspaceId } = await params;
  if (!uuidPattern.test(workspaceId)) notFound();

  const workspace = await getProfessorWorkspace(profile.id, workspaceId);
  if (!workspace) notFound();

  const students = workspace.members.filter((member) => member.role === "student");
  const professors = workspace.members.filter((member) => member.role === "professor");
  const studentInvitations = workspace.invitations.filter(
    (invitation) => invitation.invited_role === "student",
  );
  const professorInvitations = workspace.invitations.filter(
    (invitation) => invitation.invited_role === "professor",
  );

  return (
    <ProfessorShell>
      <PageMain top="pt-9">
        <Link className={backLinkClass} href="/professor">← Back to home</Link>

        {/* Title and actions wrap as two groups, so the rename field never gets squeezed between the buttons. */}
        <section className={`${panelBase} flex flex-wrap items-start justify-between gap-x-10 gap-y-6 border-(--border-shell) p-[28px_30px] max-[700px]:p-5`}>
          <div>
            <p className={sectionKickerClass}>
              {workspace.is_owner ? "Owned workspace" : "Co-professor workspace"}
            </p>
            <h1 className="m-0 text-[clamp(1.6875rem,4vw,2.375rem)] leading-[1.12]">{workspace.name}</h1>
            <p className="mt-2 mb-0 text-[0.75rem] text-[#98a2b7] light:text-(--text-muted)">{students.length} students · {professors.length} teaching staff</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {workspace.is_owner && (
              <RenameWorkspaceForm
                workspaceId={workspace.id}
                currentName={workspace.name}
              />
            )}
            <div className="flex flex-wrap gap-3">
              <Link className={activityButton.secondary} href={`/professor/activities?workspace=${workspace.id}`}>
                View workspace activities
              </Link>
              <Link className={activityButton.secondary} href={`/professor/submissions?workspace=${workspace.id}`}>
                Review submissions
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-[minmax(0,2.1fr)_minmax(260px,0.9fr)] items-start gap-5 max-[1000px]:grid-cols-1">
          <section className={`${panelBase} border-(--border-shell) p-[24px_26px_26px] max-[700px]:p-5`} aria-labelledby="roster-title">
            <div className={panelHeadingClass}>
              <div>
                <p className={sectionKickerClass}>Membership</p>
                <h2 className={sectionTitleClass} id="roster-title">Workspace roster</h2>
              </div>
              <span className="rounded-full border border-[#4d5b74] px-2.5 py-1.5 text-[0.625rem] text-[#b9c2d6] light:text-(--text-muted)">{workspace.members.length} members</span>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-[18px] max-[700px]:grid-cols-1">
              <div>
                <h3 className={columnHeadingClass}>Teaching staff</h3>
                <ul className={listResetClass}>
                  {professors.map((member) => (
                    <li className={memberRowClass} key={member.user_id}>
                      <span className={avatarClass} aria-hidden="true">
                        {member.display_name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className={memberDetailClass}><strong className={memberNameClass}>{member.display_name}</strong><small className="text-[0.625rem] text-[#8490a6] light:text-(--text-muted)">{member.is_owner ? "Owner" : "Co-professor"}</small></div>
                      {workspace.is_owner &&
                        !member.is_owner &&
                        member.user_id !== profile.id && (
                          <RemoveMemberButton workspaceId={workspace.id} memberUserId={member.user_id} />
                        )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className={columnHeadingClass}>Students</h3>
                {students.length === 0 ? (
                  <p className={listEmptyClass}>No students have joined yet.</p>
                ) : (
                  <ul className={listResetClass}>
                    {students.map((member) => (
                      <li className={memberRowClass} key={member.user_id}>
                        <span className={avatarClass} aria-hidden="true">
                          {member.display_name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className={memberDetailClass}><strong className={memberNameClass}>{member.display_name}</strong><small className="text-[0.625rem] text-[#8490a6] light:text-(--text-muted)">Student</small></div>
                        <RemoveMemberButton workspaceId={workspace.id} memberUserId={member.user_id} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <aside className={`${panelBase} border-(--border-shell) p-6`}>
            <p className={sectionKickerClass}>Your access</p>
            <h2 className={sectionTitleClass}>{workspace.is_owner ? "Workspace owner" : "Co-professor"}</h2>
            <ul className="mt-[18px] mb-0 flex list-none flex-col gap-3 p-0">
              <li className={accessItemClass}>View the complete roster</li>
              <li className={accessItemClass}>Manage students and Student invitations</li>
              <li className={accessItemClass}>{workspace.is_owner ? "Rename and manage professors" : "Owner-only settings are read only"}</li>
            </ul>
          </aside>
        </div>

        <section className={`${panelBase} mt-5 border-(--border-shell) p-[24px_26px_26px] max-[700px]:p-5`} aria-labelledby="student-invitations-title">
          <div className={panelHeadingClass}>
            <div>
              <p className={sectionKickerClass}>Invitation management</p>
              <h2 className={sectionTitleClass} id="student-invitations-title">Student invitations</h2>
            </div>
          </div>
          <div className="grid grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] gap-7 pt-5 max-[1000px]:grid-cols-1">
            <InvitationCreateForm workspaceId={workspace.id} invitedRole="student" />
            <div>
              <h3 className={columnHeadingClass}>Invitation history</h3>
              <InvitationList invitations={studentInvitations} canRevoke />
            </div>
          </div>
        </section>

        {workspace.is_owner && (
          <section className={`${panelBase} mt-5 border-(--border-shell) p-[24px_26px_26px] max-[700px]:p-5`} aria-labelledby="professor-invitations-title">
            <div className={panelHeadingClass}>
              <div>
                <p className={sectionKickerClass}>Owner controls</p>
                <h2 className={sectionTitleClass} id="professor-invitations-title">Professor invitations</h2>
              </div>
            </div>
            <div className="grid grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] gap-7 pt-5 max-[1000px]:grid-cols-1">
              <InvitationCreateForm workspaceId={workspace.id} invitedRole="professor" />
              <div>
                <h3 className={columnHeadingClass}>Invitation history</h3>
                <InvitationList invitations={professorInvitations} canRevoke />
              </div>
            </div>
          </section>
        )}

        {!workspace.is_owner && <LeaveWorkspaceForm workspaceId={workspace.id} />}
      </PageMain>
    </ProfessorShell>
  );
}
