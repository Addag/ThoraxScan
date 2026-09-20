import type { StudentFacultyEvaluation } from "@/lib/evaluations/types";

export function StudentFacultyEvaluationPanel({ evaluation, error }: { evaluation: StudentFacultyEvaluation | null; error: string | null }) {
  return <section className="faculty-evaluation-panel" aria-labelledby="student-faculty-heading">
    <h2 id="student-faculty-heading">Faculty evaluation</h2>
    {error ? <p role="alert">{error}</p> : !evaluation ? <p>Evaluation unavailable.</p> : evaluation.status === "released" ? <>
      <p className="evaluation-status">Released</p>
      <p><strong>{evaluation.score.toFixed(2)}%</strong></p>
      <p className="evaluation-text">{evaluation.feedback}</p>
      <p>Released <time dateTime={evaluation.releasedAt}>{new Date(evaluation.releasedAt).toLocaleString()}</time></p>
    </> : <p role="status">{evaluation.status === "locked" ? "Locked · submit your final response to receive a faculty evaluation." : "Awaiting review · your Professor has not released an evaluation yet."}</p>}
  </section>;
}
