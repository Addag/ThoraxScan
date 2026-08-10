import type { Metadata } from "next";

import { RolePlaceholder } from "@/components/auth/role-placeholder";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Professor workspace | ThoraxScan",
};

export default async function ProfessorPage() {
  const profile = await requireRole("professor");

  return <RolePlaceholder profile={profile} title="Professor Workspace" />;
}
