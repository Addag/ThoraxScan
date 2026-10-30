"use client";

import { button, field } from "@/components/controls";
import { useState } from "react";
import cases from "@/lib/xray-library/cases.json";

const findings = [...new Set(cases.flatMap((item) => Object.entries(item.labels).filter(([, value]) => value === 1).map(([label]) => label)))];

// Activities accept frontal images only; Learning Mode also offers laterals.
const frontalCases = cases.filter((item) => item.view === "Frontal");

export function XrayLibrary({ onSelect, disabled = false, selectedCaseId, onLoadingChange, frontalOnly = false }: {
  onSelect: (file: File, caseId: string) => void;
  disabled?: boolean;
  selectedCaseId?: string | null;
  onLoadingChange?: (loading: boolean) => void;
  frontalOnly?: boolean;
}) {
  const library = frontalOnly ? frontalCases : cases;
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visibleSelection = selectedCaseId === undefined ? selected : selectedCaseId;
  const visible = library.filter((item) => (!view || item.view === view) && (!filter || Object.entries(item.labels).some(([label, value]) => label === filter && value === 1)));

  async function select(item: typeof cases[number]) {
    setLoading(item.id);
    onLoadingChange?.(true);
    setError("");
    try {
      const response = await fetch(item.imageUrl);
      if (!response.ok) throw new Error("Image unavailable");
      const blob = await response.blob();
      if (!blob.size || blob.type !== "image/jpeg") throw new Error("Invalid image");
      onSelect(new File([blob], `${item.id}.jpg`, { type: "image/jpeg" }), item.id);
      setSelected(item.id);
    } catch {
      setError("This library image could not be loaded. Please try again.");
    } finally {
      setLoading(null);
      onLoadingChange?.(false);
    }
  }

  return <section className="grid min-w-0 gap-3.5 [&_p]:m-0 [&_p]:text-small [&_p]:leading-relaxed [&_p]:text-(--text-muted)" aria-label="Built-in X-ray library">
    <h3 className="m-0 text-title">Built-in X-ray library</h3>
    {frontalOnly
      ? <p>Frontal JPEG images from CheXpert Small’s validation folder. Choose a case to use it. Activities accept frontal views only.</p>
      : <p>All JPEG images from CheXpert Small’s validation folder, including frontal and lateral views. Choose a case to use it. Lateral results are less tested than frontal results.</p>}
    {frontalOnly ? null : <label className="grid gap-2 text-small">Filter by view
      <select className={field} value={view} onChange={(event) => setView(event.target.value)}>
        <option value="">All views</option>
        <option value="Frontal">Frontal</option>
        <option value="Lateral">Lateral</option>
      </select>
    </label>}
    <label className="grid gap-2 text-small">Filter by dataset label
      <select className={field} value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="">All findings</option>
        {findings.map((finding) => <option key={finding}>{finding}</option>)}
      </select>
    </label>
    <p>{visible.length} of {library.length} cases</p>
    <div className="grid max-h-[560px] grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3 overflow-y-auto p-0.5">
      {visible.map((item) => <article className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-(--border-subtle) p-3" key={item.id}>
        {/* Serve the original small dataset JPEG without image transformation. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="h-40 w-full rounded-control bg-[#080b10] object-contain" src={item.imageUrl} alt={`${item.title}, ${item.view}${item.projection ? ` ${item.projection}` : ""} chest X-ray`} width={320} height={320} loading="lazy" />
        <div className="flex flex-wrap justify-between gap-1.5 text-small"><strong>{item.title}</strong><span className="text-(--text-muted)">{item.view}{item.projection ? ` · ${item.projection}` : ""}</span></div>
        <details className="text-caption"><summary className="cursor-pointer">Dataset reference labels</summary>
          <p>{Object.entries(item.labels).filter(([, value]) => value === 1).map(([label]) => label).join(", ") || "No positive labels recorded"}</p>
        </details>
        <button className={`${button("secondary")} mt-auto`} type="button" disabled={disabled || loading !== null} onClick={() => void select(item)}>
          {loading === item.id ? "Loading…" : `Use ${item.title.toLowerCase()}`}
        </button>
      </article>)}
    </div>
    <p role="status">{loading ? "Loading library image…" : visibleSelection ? `${cases.find((item) => item.id === visibleSelection)?.title} loaded.` : ""}</p>
    {error ? <p role="alert">{error}</p> : null}
    <p>Source: <a className="text-inherit underline" href="https://stanfordmlgroup.github.io/competitions/chexpert/" target="_blank" rel="noreferrer">CheXpert · Stanford</a>. Labels and views come from the dataset, not model predictions or clinical review.</p>
  </section>;
}
