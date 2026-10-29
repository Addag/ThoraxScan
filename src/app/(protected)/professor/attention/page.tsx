import type { Metadata } from "next";

import { AttentionMapsContent } from "@/components/learning/attention-maps-content";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Attention maps | ThoraxScan" };

export default async function ProfessorAttentionPage() {
  await requireRole("professor");
  return (
    <ProfessorShell activeItem="attention" sectionLabel="Attention maps" sectionDescription="Understanding finding heatmaps">
      <AttentionMapsContent role="professor" />
    </ProfessorShell>
  );
}
