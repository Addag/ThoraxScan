import type { Metadata } from "next";

import { LearningModeContent } from "@/components/learning/learning-mode-content";
import { ProfessorShell } from "@/components/professor/professor-shell";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Learning Mode | ThoraxScan" };

export default async function ProfessorLearningPage() {
  await requireRole("professor");
  return (
    <ProfessorShell activeItem="learning" sectionLabel="Learning Mode" sectionDescription="Private browser practice">
      <LearningModeContent />
    </ProfessorShell>
  );
}
