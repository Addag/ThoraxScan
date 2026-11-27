"use client";

import { useEffect, useRef } from "react";
import { button } from "@/components/controls";
import { analysisReport } from "@/lib/inference/postprocess";

const detailsClass = "mt-[18px] border-t border-t-(--border-subtle) pt-3.5";
const summaryClass = "cursor-pointer font-extrabold";
const labelListClass = "mt-3 grid list-none gap-2 p-0";
const labelItemClass = "flex flex-col gap-2 rounded-control border border-(--border-subtle) px-3 py-2.5";
const labelDetailClass = "text-small text-(--text-secondary)";
const POSSIBLE_CAVEAT = "Below the likely threshold but above a lower, more sensitive one. Check these against the image yourself; many will be false alarms.";

type Label = { label: string; probability: number; threshold: number; predicted: boolean; possible: boolean };

const statusOf = (item: Label) => item.predicted ? "Likely" : item.possible ? "Possible" : "Not matched";
const barColor = (item: Label) => item.predicted ? "var(--brand-blue)" : item.possible ? "var(--disclaimer-yellow)" : "var(--border-strong)";

/** Probability of every label as horizontal bars, with the release threshold marked on each. */
function ProbabilityChart({ labels, idPrefix }: { labels: Label[]; idPrefix: string }) {
  const sorted = [...labels].sort((a, b) => b.probability - a.probability);
  return <section className="mt-5" aria-labelledby={`${idPrefix}-chart-title`}>
    <h3 className="mb-1 text-lead font-extrabold" id={`${idPrefix}-chart-title`}>Label probabilities</h3>
    <p className="mb-3 text-small text-(--text-muted)">Each bar is the AI&apos;s probability for one label; the thin line marks the threshold for &ldquo;Likely&rdquo;.</p>
    <ul className="m-0 grid list-none gap-3 p-0">{sorted.map((item) => <li key={item.label} className="grid gap-1.5 text-small">
      <span className="flex items-baseline justify-between gap-3"><span className="min-w-0 text-(--text-primary)">{item.label}</span><span className="shrink-0 text-(--text-secondary) tabular-nums">{(item.probability * 100).toFixed(1)}% · {statusOf(item)}</span></span>
      <span className="relative h-2.5 rounded-full bg-(--surface-sunken)" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(item.probability * 100, 1)}%`, background: barColor(item) }} />
        <span className="absolute -inset-y-1 w-0.5 bg-(--text-muted)" style={{ left: `${Math.min(item.threshold, 1) * 100}%` }} />
      </span>
    </li>)}</ul>
  </section>;
}

/** Opens once when the result has possible findings, so the caveat can't be missed. */
function PossibleFindingsDialog({ count, idPrefix }: { count: number; idPrefix: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (ref.current && !ref.current.open) ref.current.showModal(); }, []);
  return <dialog ref={ref} aria-labelledby={`${idPrefix}-possible-dialog-title`} className="m-auto w-[min(440px,calc(100vw-32px))] rounded-panel border border-(--border-shell) bg-(--surface-raised) [background-image:var(--glass-surface)] p-6 text-left text-(--text-primary) shadow-(--glass-shadow) backdrop:bg-[rgb(0_4_18/60%)] backdrop:backdrop-blur-[3px] max-[520px]:p-5">
    <h2 id={`${idPrefix}-possible-dialog-title`} className="m-0 text-lead font-extrabold"><span aria-hidden="true">⚠ </span>{count} possible finding{count === 1 ? "" : "s"}</h2>
    <p className="mt-2.5 text-small leading-normal text-(--text-secondary)">{POSSIBLE_CAVEAT}</p>
    <form method="dialog" className="mt-5 flex justify-end"><button className={button("primary")} type="submit">I understand</button></form>
  </dialog>;
}

/** AI result body shared by Learning Mode and activity AI feedback: report, chart, findings, and full label list. */
export function AnalysisFindings({ state, labels, findings, possibleFindings, idPrefix }: {
  state: "predicted" | "no-threshold-match";
  labels: Label[];
  findings: Label[];
  possibleFindings: Label[];
  idPrefix: string;
}) {
  const suppressedLabels = labels.filter((item) => item.predicted && !findings.some((finding) => finding.label === item.label));
  const report = analysisReport({ state, labels });
  return <>
    <p className="mb-4 flex items-start gap-2 rounded-control border border-(--disclaimer-yellow) px-3 py-2 text-small font-semibold text-(--status-warning-text)" role="note"><span aria-hidden="true">✦</span><span>AI-generated result. Not a diagnosis; it should not guide medical decisions.</span></p>
    <section className="rounded-control border border-(--border-subtle) p-4" aria-labelledby={`${idPrefix}-report-title`}>
      <h3 className="m-0 text-lead font-extrabold" id={`${idPrefix}-report-title`}>AI-generated radiographic report</h3>
      <dl className="mt-3 grid gap-3 text-small leading-normal [&>div>dd]:m-0 [&>div>dd]:mt-1 [&>div>dt]:font-bold [&>div>dt]:text-(--text-secondary)">
        <div><dt>Type of exam</dt><dd>{report.exam}</dd></div>
        {report.interpretation.length > 0 && <div><dt>Interpretation</dt><dd><ul className="m-0 grid list-none gap-1 p-0">{report.interpretation.map((line) => <li key={line}>{line}</li>)}</ul></dd></div>}
        <div><dt>Impression</dt><dd className="font-semibold">{report.impression}</dd></div>
      </dl>
      <p className="mt-3 mb-0 text-caption text-(--text-muted)">Written automatically from the AI&apos;s label scores. Not a diagnosis.</p>
    </section>
    <ProbabilityChart labels={labels} idPrefix={idPrefix} />
    <section className="mt-5" aria-labelledby={`${idPrefix}-findings-title`}><h3 className="mb-3 text-lead font-extrabold" id={`${idPrefix}-findings-title`}>Likely findings</h3>{state === "no-threshold-match" ? <p>No finding met its configured threshold.</p> : <ul className={labelListClass}>{findings.map((finding) => <li className={labelItemClass} key={finding.label}><strong>{finding.label}</strong><span className={labelDetailClass}>{(finding.probability * 100).toFixed(1)}% probability</span></li>)}</ul>}</section>
    {possibleFindings.length > 0 && <section className="mt-5" aria-labelledby={`${idPrefix}-possible-title`}>
      <PossibleFindingsDialog count={possibleFindings.length} idPrefix={idPrefix} />
      <h3 className="mb-2 text-lead font-extrabold" id={`${idPrefix}-possible-title`}>Possible findings</h3>
      <p className="mb-3 border-l-[3px] border-l-(color:--disclaimer-yellow) pl-2.5 text-small font-semibold leading-normal text-(--status-warning-text)"><span aria-hidden="true">⚠ </span>{POSSIBLE_CAVEAT}</p>
      <ul className={labelListClass}>{possibleFindings.map((finding) => <li className={labelItemClass} key={finding.label}><strong>{finding.label}</strong><span className={labelDetailClass}>{(finding.probability * 100).toFixed(1)}% probability</span></li>)}</ul>
    </section>}
    {suppressedLabels.map((item) => <p className="text-(--status-warning-text)" key={item.label}>{item.label}: Suppressed by abnormal finding.</p>)}
    <details className={detailsClass}><summary className={summaryClass}>All {labels.length} labels</summary><ul className={labelListClass}>{labels.map((item) => <li className={labelItemClass} key={item.label}><div className="flex flex-col gap-1"><strong>{item.label}</strong><span className={labelDetailClass}>{statusOf(item)}{suppressedLabels.includes(item) ? " · Suppressed by abnormal finding" : ""}</span></div><span className={labelDetailClass}>Probability {(item.probability * 100).toFixed(2)}% · Release-supplied threshold {item.threshold}</span></li>)}</ul></details>
  </>;
}
