"use client";

import { useState } from "react";
import Image from "next/image";
import cases from "@/lib/xray-library/cases.json";

const findings = [...new Set(cases.flatMap((item) => Object.entries(item.labels).filter(([, value]) => value === 1).map(([label]) => label)))];

export function XrayLibrary({ onSelect, disabled = false }: {
  onSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visible = cases.filter((item) => !filter || Object.entries(item.labels).some(([label, value]) => label === filter && value === 1));

  async function select(item: typeof cases[number]) {
    setLoading(item.id);
    setError("");
    try {
      const response = await fetch(item.imageUrl);
      if (!response.ok) throw new Error("Image unavailable");
      const blob = await response.blob();
      if (!blob.size || blob.type !== "image/jpeg") throw new Error("Invalid image");
      onSelect(new File([blob], `${item.id}.jpg`, { type: "image/jpeg" }));
      setSelected(item.id);
    } catch {
      setError("This library image could not be loaded. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return <section className="xray-library" aria-label="Built-in X-ray library">
    <h3>Built-in X-ray library</h3>
    <p>Frontal images selected from CheXpert Small’s validation set. Choose a case to use it.</p>
    <label className="xray-library-filter">Filter by dataset label
      <select value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="">All findings</option>
        {findings.map((finding) => <option key={finding}>{finding}</option>)}
      </select>
    </label>
    <p className="xray-library-count">{visible.length} of {cases.length} cases</p>
    <div className="xray-library-grid">
      {visible.map((item) => <article className="xray-library-case" key={item.id}>
        <Image src={item.imageUrl} alt={`${item.title}, frontal ${item.projection} chest X-ray`} width={320} height={320} unoptimized />
        <div><strong>{item.title}</strong><span>Frontal · {item.projection}</span></div>
        <details><summary>Dataset reference labels</summary>
          <p>{Object.entries(item.labels).filter(([, value]) => value === 1).map(([label]) => label).join(", ") || "No positive labels recorded"}</p>
        </details>
        <button type="button" disabled={disabled || loading !== null} onClick={() => void select(item)}>
          {loading === item.id ? "Loading…" : `Use ${item.title.toLowerCase()}`}
        </button>
      </article>)}
    </div>
    <p role="status">{loading ? "Loading library image…" : selected ? `${cases.find((item) => item.id === selected)?.title} loaded.` : ""}</p>
    {error ? <p role="alert">{error}</p> : null}
    <p className="xray-library-source">Source: <a href="https://stanfordmlgroup.github.io/competitions/chexpert/" target="_blank" rel="noreferrer">CheXpert · Stanford</a>. Labels are dataset references, not model predictions. Selection is based on labels, not clinical review. No fracture-positive frontal image is present in the supplied validation CSV.</p>
  </section>;
}
