import type { Metadata } from "next";

import { AttentionMapsContent } from "@/components/learning/attention-maps-content";
import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Attention Maps | ThoraxScan" };

export default async function StudentAttentionPage() {
  await requireRole("student");
  return (
    <StudentShell activeItem="attention" sectionLabel="Attention Maps" sectionDescription="Understanding finding heatmaps">
      <AttentionMapsContent role="student" />
    </StudentShell>
  );
}
