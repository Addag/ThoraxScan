import { getProfessorReport } from "@/lib/admin/server";
import { csvCell } from "@/lib/analytics/summary";

// list_professor_report raises for anyone who is not an administrator.
export async function GET() {
  const { data, error } = await getProfessorReport();
  if (error) return new Response("Forbidden", { status: 403 });

  const header = ["Professor", "Email", "Workspaces", "Students", "Activities", "Final submissions", "Feedback released"];
  const lines = data.map((row) => [row.display_name, row.email, row.workspaces, row.students, row.activities, row.final_submissions, row.feedback_released]);
  return new Response([header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="thoraxscan-professor-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
