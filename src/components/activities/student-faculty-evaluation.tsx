import type { StudentFacultyEvaluation } from "@/lib/evaluations/types";

import { evaluationStatusClass } from "@/components/professor/review-styles";

const mutedClass = "mx-0 mt-0 mb-3 text-[0.8125rem] leading-[1.5] text-(--text-muted)";

export function StudentFacultyEvaluationPanel({ evaluation, error }: { evaluation: StudentFacultyEvaluation | null; error: string | null }) {
  return <section className="mt-6 rounded-panel border border-(--border-shell) [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow) p-6 max-[520px]:p-5 text-(--text-primary)" aria-labelledby="student-faculty-heading">
    <h2 className="mx-0 mt-0 mb-3.5 text-[1.125rem] font-extrabold" id="student-faculty-heading">Faculty evaluation</h2>
    {error ? <p className={mutedClass} role="alert">{error}</p> : !evaluation ? <p className={mutedClass}>Evaluation unavailable.</p> : evaluation.status === "released" ? <>
      <p className={`mx-0 mt-0 mb-3 inline-block text-(--text-muted) ${evaluationStatusClass()}`}>Released</p>
      <p className="mx-0 mt-0 mb-3 text-[2rem] leading-none font-extrabold">{evaluation.score.toFixed(2)}%</p>
      <p className="mx-0 mt-0 mb-3 whitespace-pre-wrap text-[0.9375rem] leading-[1.6]">{evaluation.feedback}</p>
      <p className={mutedClass}>Released <time dateTime={evaluation.releasedAt}>{new Date(evaluation.releasedAt).toLocaleString()}</time></p>
    </> : <p className={mutedClass} role="status">{evaluation.status === "locked" ? "Locked · submit your final response to receive a faculty evaluation." : "Awaiting review · your Professor has not released an evaluation yet."}</p>}
  </section>;
}
