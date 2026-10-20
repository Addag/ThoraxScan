import type { StudentFacultyEvaluation } from "@/lib/evaluations/types";

import { evaluationStatusClass, reviewPanelTextClass } from "@/components/professor/review-styles";

export function StudentFacultyEvaluationPanel({ evaluation, error }: { evaluation: StudentFacultyEvaluation | null; error: string | null }) {
  return <section className="text-[#f6f8ff] light:text-(--text-primary)" aria-labelledby="student-faculty-heading">
    <h2 id="student-faculty-heading">Faculty evaluation</h2>
    {error ? <p className={reviewPanelTextClass} role="alert">{error}</p> : !evaluation ? <p className={reviewPanelTextClass}>Evaluation unavailable.</p> : evaluation.status === "released" ? <>
      <p className={`mx-0 mt-0 mb-3 leading-[1.5] text-[#b7c5d9] light:text-(--text-muted) ${evaluationStatusClass()}`}>Released</p>
      <p className={reviewPanelTextClass}><strong>{evaluation.score.toFixed(2)}%</strong></p>
      <p className="mx-0 mt-0 mb-3 whitespace-pre-wrap text-[12px] leading-[1.5] text-[#b7c5d9] light:text-(--text-muted)">{evaluation.feedback}</p>
      <p className={reviewPanelTextClass}>Released <time dateTime={evaluation.releasedAt}>{new Date(evaluation.releasedAt).toLocaleString()}</time></p>
    </> : <p className={reviewPanelTextClass} role="status">{evaluation.status === "locked" ? "Locked · submit your final response to receive a faculty evaluation." : "Awaiting review · your Professor has not released an evaluation yet."}</p>}
  </section>;
}
