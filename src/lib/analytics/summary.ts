// Pure class-analytics aggregation. Professors only ever see final submissions,
// so a Student/activity pair is on time, late, missing (past due), or open.
export type AnalyticsStudent = { id: string; name: string };
export type AnalyticsActivity = { id: string; title: string; dueAt: string | null };
export type AnalyticsSubmission = {
  activityId: string; studentId: string; submittedAt: string; classification: string;
  evaluation: { status: "draft" | "released"; score: number | null } | null;
};
export type AICall = "normal" | "abnormal";

type Counts = { submitted: number; late: number; missing: number; scores: number[]; agree: number; compared: number };
const emptyCounts = (): Counts => ({ submitted: 0, late: 0, missing: 0, scores: [], agree: 0, compared: 0 });

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);
const average = (values: number[]) => (values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null);

export function summarizeClass({ students, activities, submissions, aiCalls, now }: {
  students: AnalyticsStudent[]; activities: AnalyticsActivity[]; submissions: AnalyticsSubmission[];
  aiCalls: Map<string, AICall>; now: Date;
}) {
  const studentIds = new Set(students.map((student) => student.id));
  const byPair = new Map<string, AnalyticsSubmission>();
  for (const submission of submissions) {
    if (studentIds.has(submission.studentId)) byPair.set(`${submission.activityId}:${submission.studentId}`, submission);
  }
  const perActivity = new Map(activities.map((activity) => [activity.id, emptyCounts()]));
  const perStudent = new Map(students.map((student) => [student.id, emptyCounts()]));
  const review = { unreviewed: 0, draft: 0, released: 0 };

  for (const activity of activities) {
    const due = activity.dueAt ? new Date(activity.dueAt) : null;
    const aiCall = aiCalls.get(activity.id);
    for (const student of students) {
      const counts = [perActivity.get(activity.id)!, perStudent.get(student.id)!];
      const submission = byPair.get(`${activity.id}:${student.id}`);
      if (!submission) {
        if (due && due < now) counts.forEach((count) => count.missing++);
        continue;
      }
      const late = due !== null && new Date(submission.submittedAt) > due;
      const released = submission.evaluation?.status === "released" ? submission.evaluation.score : null;
      review[submission.evaluation?.status ?? "unreviewed"]++;
      for (const count of counts) {
        count.submitted++;
        if (late) count.late++;
        if (released !== null) count.scores.push(released);
        if (aiCall) { count.compared++; if (submission.classification === aiCall) count.agree++; }
      }
    }
  }

  const all = [...perActivity.values()];
  const sum = (key: "submitted" | "late" | "missing" | "agree" | "compared") => all.reduce((total, count) => total + count[key], 0);
  const scores = all.flatMap((count) => count.scores);
  const expected = students.length * activities.length;
  return {
    totals: {
      students: students.length, activities: activities.length, submitted: sum("submitted"), expected,
      completion: percent(sum("submitted"), expected), onTime: percent(sum("submitted") - sum("late"), sum("submitted")),
      late: sum("late"), missing: sum("missing"),
      averageScore: average(scores), minScore: scores.length ? Math.min(...scores) : null, maxScore: scores.length ? Math.max(...scores) : null,
      review, agreement: percent(sum("agree"), sum("compared")), compared: sum("compared"),
    },
    perActivity: activities.map((activity) => {
      const count = perActivity.get(activity.id)!;
      return { id: activity.id, title: activity.title, dueAt: activity.dueAt, submitted: count.submitted, roster: students.length,
        late: count.late, missing: count.missing, averageScore: average(count.scores), aiCall: aiCalls.get(activity.id) ?? null,
        agreement: percent(count.agree, count.compared) };
    }),
    perStudent: students.map((student) => {
      const count = perStudent.get(student.id)!;
      return { id: student.id, name: student.name, submitted: count.submitted, total: activities.length, late: count.late,
        missing: count.missing, averageScore: average(count.scores), agreement: percent(count.agree, count.compared) };
    }),
  };
}

export type ClassSummary = ReturnType<typeof summarizeClass>;

// Quote every cell and neutralize formula prefixes so spreadsheets never evaluate names.
function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}

export function toCsv(rows: ClassSummary["perStudent"]) {
  const header = ["Student", "Submitted", "Activities", "Late", "Missing", "Average released score", "AI agreement %"];
  const lines = rows.map((row) => [row.name, row.submitted, row.total, row.late, row.missing, row.averageScore, row.agreement]);
  return [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
