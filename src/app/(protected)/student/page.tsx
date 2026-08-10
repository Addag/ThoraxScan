import type { Metadata } from "next";

import { RolePlaceholder } from "@/components/auth/role-placeholder";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Student workspace | ThoraxScan",
};

export default async function StudentPage() {
  const profile = await requireRole("student");

  return <RolePlaceholder profile={profile} title="Student Workspace" />;
}
