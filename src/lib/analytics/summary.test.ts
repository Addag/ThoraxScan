import { describe, expect, it } from "vitest";
import { summarizeClass, toCsv, type AnalyticsSubmission } from "./summary";

const now = new Date("2026-10-28T00:00:00Z");
const students = [{ id: "s1", name: "Ana" }, { id: "s2", name: "=HYPERLINK(\"x\")" }];
const activities = [
  { id: "past", title: "Past due", dueAt: "2026-10-20T00:00:00Z" },
  { id: "future", title: "Not due", dueAt: "2026-11-20T00:00:00Z" },
  { id: "open", title: "No due date", dueAt: null },
];
const submission = (activityId: string, studentId: string, submittedAt: string, classification: string, evaluation: AnalyticsSubmission["evaluation"] = null): AnalyticsSubmission =>
  ({ activityId, studentId, submittedAt, classification, evaluation });
const submissions = [
  submission("past", "s1", "2026-10-19T00:00:00Z", "abnormal", { status: "released", score: 90 }),
  submission("future", "s1", "2026-10-25T00:00:00Z", "normal", { status: "draft", score: 40 }),
  submission("open", "s1", "2026-10-26T00:00:00Z", "normal"),
  submission("past", "s2", "2026-10-21T00:00:00Z", "normal", { status: "released", score: 70 }),
  submission("past", "gone", "2026-10-19T00:00:00Z", "normal", { status: "released", score: 0 }),
];

describe("class analytics summary", () => {
  const summary = summarizeClass({ students, activities, submissions, aiCalls: new Map([["past", "abnormal"]]), now });

  it("classifies on-time, late, missing, and open pairs over the current roster", () => {
    expect(summary.totals).toMatchObject({ submitted: 4, expected: 6, completion: 67, late: 1, onTime: 75, missing: 0 });
    expect(summary.perStudent[1]).toMatchObject({ submitted: 1, late: 1, missing: 0 });
    const missing = summarizeClass({ students, activities, submissions: [], aiCalls: new Map(), now });
    expect(missing.totals.missing).toBe(2);
  });

  it("averages released scores only and counts the review backlog", () => {
    expect(summary.totals).toMatchObject({ averageScore: 80, minScore: 70, maxScore: 90, review: { unreviewed: 1, draft: 1, released: 2 } });
    expect(summary.perStudent[0].averageScore).toBe(90);
  });

  it("compares against the AI only where it made a call", () => {
    expect(summary.totals).toMatchObject({ agreement: 50, compared: 2 });
    expect(summary.perActivity.map((row) => row.agreement)).toEqual([50, null, null]);
  });

  it("quotes cells and neutralizes formulas in CSV", () => {
    const csv = toCsv(summary.perStudent);
    expect(csv).toContain('"Ana","3","3","0","0","90","100"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
