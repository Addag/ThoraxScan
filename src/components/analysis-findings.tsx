const detailsClass = "mt-[18px] border-t border-t-[#3f5271] pt-3.5";
const summaryClass = "cursor-pointer font-bold";
const labelListClass = "mt-3 grid list-none gap-2 p-0";
const labelItemClass = "flex flex-col gap-2 rounded-[7px] border border-[#3f5271] px-3 py-2.5";
const labelDetailClass = "text-[0.8125rem] text-(--text-secondary)";

type Label = { label: string; probability: number; threshold: number; predicted: boolean; possible: boolean };

/** Likely/possible findings and the full label list, shared by Learning Mode and activity AI feedback. */
export function AnalysisFindings({ state, labels, findings, possibleFindings, idPrefix }: {
  state: "predicted" | "no-threshold-match";
  labels: Label[];
  findings: Label[];
  possibleFindings: Label[];
  idPrefix: string;
}) {
  const suppressedLabels = labels.filter((item) => item.predicted && !findings.some((finding) => finding.label === item.label));
  return <>
    <section aria-labelledby={`${idPrefix}-findings-title`}><h3 className="mb-3" id={`${idPrefix}-findings-title`}>Likely findings</h3>{state === "no-threshold-match" ? <p>No finding met its configured threshold.</p> : <ul className={labelListClass}>{findings.map((finding) => <li className={labelItemClass} key={finding.label}><strong>{finding.label}</strong><span className={labelDetailClass}>{(finding.probability * 100).toFixed(1)}% probability</span></li>)}</ul>}</section>
    {possibleFindings.length > 0 && <section className="mt-5" aria-labelledby={`${idPrefix}-possible-title`}><h3 className="mb-1" id={`${idPrefix}-possible-title`}>Possible findings</h3><p className="mb-3 text-[0.8125rem] leading-[1.5] text-(--text-muted)">Below the likely threshold but above a lower, more sensitive one. Check these against the image yourself; many will be false alarms.</p><ul className={labelListClass}>{possibleFindings.map((finding) => <li className={labelItemClass} key={finding.label}><strong>{finding.label}</strong><span className={labelDetailClass}>{(finding.probability * 100).toFixed(1)}% probability</span></li>)}</ul></section>}
    {suppressedLabels.map((item) => <p className="text-[#ffd98b] light:text-(--status-warning-text)" key={item.label}>{item.label}: Suppressed by abnormal finding.</p>)}
    <details className={detailsClass}><summary className={summaryClass}>All {labels.length} labels</summary><ul className={labelListClass}>{labels.map((item) => <li className={labelItemClass} key={item.label}><div className="flex flex-col gap-1"><strong>{item.label}</strong><span className={labelDetailClass}>{item.predicted ? "Likely" : item.possible ? "Possible" : "Not matched"}{suppressedLabels.includes(item) ? " · Suppressed by abnormal finding" : ""}</span></div><span className={labelDetailClass}>Probability {(item.probability * 100).toFixed(2)}% · Release-supplied threshold {item.threshold}</span></li>)}</ul></details>
  </>;
}
