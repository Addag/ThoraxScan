import type { Metadata } from "next";

import { LearningModeContent } from "@/components/learning/learning-mode-content";
import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Learning Mode | ThoraxScan" };

export default async function StudentLearningPage() {
  await requireRole("student");
  return (
    <StudentShell activeItem="learning" sectionLabel="Learning Mode" sectionDescription="Private browser practice">
      <LearningModeContent />
    </StudentShell>
  );
}
