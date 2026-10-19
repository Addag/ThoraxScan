import type { Metadata } from "next";

import { AttentionMapsContent } from "@/components/learning/attention-maps-content";
import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Attention maps | ThoraxScan" };

export default async function StudentAttentionPage() {
  await requireRole("student");
  return (
    <StudentShell activeItem="attention" sectionLabel="Attention maps" sectionDescription="Understanding patch attention">
      <AttentionMapsContent role="student" />
    </StudentShell>
  );
}
