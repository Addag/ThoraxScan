import type { Metadata } from "next";

import { StudentLearningModeAnalyzer } from "@/components/student/learning-mode-analyzer";
import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Learning mode | ThoraxScan" };

export default async function StudentLearningPage() {
  await requireRole("student");
  return (
    <StudentShell activeItem="learning" sectionLabel="Learning mode" sectionDescription="Private browser practice">
      <main className="student-learning-page">
        <div className="student-page-heading">
          <div><p className="student-section-kicker">Non-graded practice</p><h1>Explore a chest X-ray</h1><p>Select a frontal chest X-ray to run the active model in this browser.</p></div>
        </div>
        <StudentLearningModeAnalyzer />
      </main>
    </StudentShell>
  );
}
