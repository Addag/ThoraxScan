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

export const metadata: Metadata = {
  title: "Manage workspace | ThoraxScan",
};

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
    return <p className="professor-list-empty">No invitation history yet.</p>;
  }

  return (
    <ul className="professor-invitation-list">
      {invitations.map((invitation) => {
        const status = invitationStatus(invitation);
        return (
          <li key={invitation.id}>
            <div>
              <strong>{status}</strong>
              <span>
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
      <main className="student-dashboard professor-workspace-detail">
        <Link className="student-back-link" href="/professor">← Back to dashboard</Link>

        <section className="professor-workspace-hero">
          <div>
            <p className="student-section-kicker">
              {workspace.is_owner ? "Owned workspace" : "Co-professor workspace"}
            </p>
            <h1>{workspace.name}</h1>
            <p>{students.length} students · {professors.length} teaching staff</p>
          </div>
          {workspace.is_owner && (
            <RenameWorkspaceForm
              workspaceId={workspace.id}
              currentName={workspace.name}
            />
          )}
        </section>

        <div className="professor-management-grid">
          <section className="professor-roster-panel" aria-labelledby="roster-title">
            <div className="professor-panel-heading">
              <div>
                <p className="student-section-kicker">Membership</p>
                <h2 id="roster-title">Workspace roster</h2>
              </div>
              <span>{workspace.members.length} members</span>
            </div>
            <div className="professor-roster-groups">
              <div>
                <h3>Teaching staff</h3>
                <ul>
                  {professors.map((member) => (
                    <li key={member.user_id}>
                      <span className="professor-avatar" aria-hidden="true">
                        {member.display_name.slice(0, 1).toUpperCase()}
                      </span>
                      <div><strong>{member.display_name}</strong><small>{member.is_owner ? "Owner" : "Co-professor"}</small></div>
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
                <h3>Students</h3>
                {students.length === 0 ? (
                  <p className="professor-list-empty">No students have joined yet.</p>
                ) : (
                  <ul>
                    {students.map((member) => (
                      <li key={member.user_id}>
                        <span className="professor-avatar" aria-hidden="true">
                          {member.display_name.slice(0, 1).toUpperCase()}
                        </span>
                        <div><strong>{member.display_name}</strong><small>Student</small></div>
                        <RemoveMemberButton workspaceId={workspace.id} memberUserId={member.user_id} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <aside className="professor-access-summary">
            <p className="student-section-kicker">Your access</p>
            <h2>{workspace.is_owner ? "Workspace owner" : "Co-professor"}</h2>
            <ul>
              <li>View the complete roster</li>
              <li>Manage students and Student invitations</li>
              <li>{workspace.is_owner ? "Rename and manage professors" : "Owner-only settings are read only"}</li>
            </ul>
          </aside>
        </div>

        <section className="professor-invitations-panel" aria-labelledby="student-invitations-title">
          <div className="professor-panel-heading">
            <div>
              <p className="student-section-kicker">Invitation management</p>
              <h2 id="student-invitations-title">Student invitations</h2>
            </div>
          </div>
          <div className="professor-invitation-columns">
            <InvitationCreateForm workspaceId={workspace.id} invitedRole="student" />
            <div>
              <h3>Invitation history</h3>
              <InvitationList invitations={studentInvitations} canRevoke />
            </div>
          </div>
        </section>

        {workspace.is_owner && (
          <section className="professor-invitations-panel" aria-labelledby="professor-invitations-title">
            <div className="professor-panel-heading">
              <div>
                <p className="student-section-kicker">Owner controls</p>
                <h2 id="professor-invitations-title">Professor invitations</h2>
              </div>
            </div>
            <div className="professor-invitation-columns">
              <InvitationCreateForm workspaceId={workspace.id} invitedRole="professor" />
              <div>
                <h3>Invitation history</h3>
                <InvitationList invitations={professorInvitations} canRevoke />
              </div>
            </div>
          </section>
        )}

        {!workspace.is_owner && <LeaveWorkspaceForm workspaceId={workspace.id} />}
      </main>
    </ProfessorShell>
  );
}
