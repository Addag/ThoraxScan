"use client";

import { button } from "@/components/controls";
import { useEffect, useRef, useState } from "react";
import { InferenceError, type InferenceErrorCode } from "@/lib/inference/errors";
import type { InferenceResult } from "@/lib/inference/runtime";
import { AttentionHeatmap } from "@/components/attention-heatmap";
import { AnalysisFindings } from "@/components/analysis-findings";
import { XrayLibrary } from "./xray-library";

const MAX_BYTES = 6 * 1024 * 1024;
type AnalyzerState = "idle" | "selected" | "running" | "success" | "error";

const errorCopy: Record<InferenceErrorCode, string> = {
  NO_ACTIVE_MODEL: "The active model is unavailable. Try again later.",
  UNSUPPORTED_MANIFEST: "The active model configuration is not supported by this application.",
  ARTIFACT_INTEGRITY_FAILED: "The model download did not pass its integrity check. Try again.",
  PREPROCESSING_FAILED: "This image could not be prepared. Select a non-empty JPEG or PNG chest X-ray.",
  MODEL_LOAD_FAILED: "The model could not be loaded or run in this browser. Try again.",
  INVALID_OUTPUT: "The model returned an invalid result. Try again later.",
};

const panelClass = "overflow-hidden rounded-panel border border-(--border-subtle) bg-(--surface-field)";
const detailsClass = "mt-[18px] border-t border-t-(--border-subtle) pt-3.5";
const summaryClass = "cursor-pointer font-extrabold";

function messageForError(error: unknown) {
  if (error instanceof InferenceError) return errorCopy[error.code];
  return "Analysis could not be completed. Try again.";
}

function validate(file: File) {
  if (file.size < 1) return "The selected image is empty.";
  if (file.size > MAX_BYTES) return "Images must be 6 MiB or smaller.";
  if (file.type !== "image/jpeg" && file.type !== "image/png") return "Only JPEG and PNG images are supported.";
  return null;
}

export function LearningModeAnalyzer() {
  const [state, setState] = useState<AnalyzerState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runRef = useRef<AbortController | null>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => { runRef.current?.abort(); }, []);
  useEffect(() => { if (state === "success") resultHeadingRef.current?.focus(); }, [state]);

  function choose(next: File | null) {
    runRef.current?.abort();
    runRef.current = null;
    setResult(null); setError(null); setFile(next); setPreviewUrl(null);
    if (!next) { setState("idle"); return; }
    const validationError = validate(next);
    if (validationError) { setState("error"); setError(validationError); return; }
    setPreviewUrl(URL.createObjectURL(next)); setState("selected");
  }

  function reset() { if (inputRef.current) inputRef.current.value = ""; choose(null); }

  async function run() {
    if (!file || validate(file) || state === "running" || runRef.current) return;
    const controller = new AbortController(); runRef.current = controller; setResult(null); setState("running"); setError(null);
    try {
      const { analyzeImage } = await import("@/lib/inference/runtime");
      if (controller.signal.aborted) return;
      const next = await analyzeImage(file, { signal: controller.signal });
      if (controller.signal.aborted || runRef.current !== controller) return;
      setResult(next); setState("success");
    } catch (caught) {
      if (controller.signal.aborted || runRef.current !== controller) return;
      if (caught instanceof Error && caught.name === "AbortError") { setState("selected"); return; }
      setError(messageForError(caught)); setState("error");
    } finally { if (runRef.current === controller) runRef.current = null; }
  }

  return <section className="grid grid-cols-2 items-start gap-8 max-[1000px]:gap-5 max-[800px]:grid-cols-1" aria-label="Learning Mode practice">
    <div className="min-w-0">
      <div className={panelClass}>
        <h2 className="m-0 flex items-center gap-4 border-b border-b-(--border-subtle) px-[18px] py-3.5 text-[1rem] font-extrabold"><img className="light:invert" src="/images/learning/eye.svg" alt="" width="26" height="26" /> Select a Chest X-Ray</h2>
        <div className="p-6 max-[1000px]:p-4">
          <label className="mb-2.5 block text-[0.8125rem] text-(--text-secondary)" htmlFor="learning-image">Chest X-ray image (JPEG or PNG, up to 6 MiB)</label>
          {/* The drop zone below is the one visible picker; clicking it opens this input's file dialog. */}
          <input className="sr-only" tabIndex={-1} ref={inputRef} id="learning-image" aria-label="Image file" type="file" accept="image/jpeg,image/png" onChange={(event) => choose(event.target.files?.[0] ?? null)} />
          <button className={`transition-colors duration-160 not-disabled:hover:bg-(--hover-overlay) flex min-h-[240px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-panel border-2 border-dashed ${dragging ? "border-brand" : "border-(--border-strong)"} bg-none p-3 text-(--text-secondary)`} type="button" aria-label={previewUrl ? "Replace selected image" : "Choose or drop a chest X-ray image"} onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
            onDrop={(event) => {
              event.preventDefault(); setDragging(false);
              const dropped = event.dataTransfer.files[0];
              if (!dropped) return;
              if (inputRef.current) inputRef.current.value = "";
              choose(dropped);
            }}>
            {previewUrl ? (
              // Local object URLs must never go through an image optimization server.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="block max-h-[360px] w-full object-contain" src={previewUrl} alt="Selected chest X-ray preview" />
            ) : <><img className="light:invert" src="/images/learning/plus.svg" alt="" width="32" height="32" /><span>Choose or drop a local image</span></>}
          </button>
          {file && <p className="text-[0.8125rem] [overflow-wrap:anywhere] text-(--text-secondary)">{file.name}</p>}
          <div className="mt-5 flex gap-3">
            <button className={button("primary")} type="button" onClick={run} disabled={!file || Boolean(validate(file)) || state === "running"}>Analyze</button>
            <button className={button("secondary")} type="button" onClick={reset} disabled={state === "idle"}>Reset</button>
          </div>
          <p className="mt-3 min-h-5 text-[0.8125rem] text-(--brand-blue-text)" aria-live="polite">{state === "running" ? "Analyzing in this browser…" : state === "selected" ? "Image ready to analyze." : state === "success" ? "Analysis complete." : ""}</p>
          {error && <p className="border-l-[3px] border-l-[#ff8d8d] px-3 py-2 text-(--status-error-text)" role="alert">{error}</p>}
        </div>
      </div>
      <p className="mt-4 text-[0.8125rem] leading-[1.6] text-(--text-muted)">Your selected image stays in browser memory. The application contacts Supabase for the active release and downloads the model artifact.</p>
    </div>
    <div className="min-w-0">
    {result ? <div className={`${panelClass} p-6 max-[480px]:p-5`} aria-live="polite">
      <h2 className="mb-5 text-[1.5rem] font-extrabold" tabIndex={-1} ref={resultHeadingRef}>Analysis result</h2>
      <AnalysisFindings state={result.state} labels={result.labels} findings={result.findings} possibleFindings={result.possibleFindings} idPrefix="learning" />
      <details className={detailsClass}><summary className={summaryClass}>Release and execution provenance</summary><dl className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-2.5 text-[0.8125rem] max-[480px]:grid-cols-1 [&>dd]:m-0 [&>dd]:[overflow-wrap:anywhere] [&>dt]:text-(--text-muted)"><dt>Release ID</dt><dd>{result.releaseId}</dd><dt>Execution provider</dt><dd>{result.executionProvider.toUpperCase()}</dd><dt>Manifest version</dt><dd>{result.manifestVersion}</dd><dt>Preprocessing version</dt><dd>{result.preprocessingVersion}</dd><dt>Threshold version</dt><dd>{result.thresholdVersion}</dd><dt>Application build</dt><dd>{result.applicationBuild}</dd><dt>Model SHA-256</dt><dd>{result.modelSha256}</dd><dt>Bundle SHA-256</dt><dd>{result.bundleSha256}</dd></dl></details>
      <AttentionHeatmap imageUrl={previewUrl} attention={result.attention ?? { status: "unavailable", reason: "legacy-model-release" }} labels={result.labels} title="Finding heatmap" />
      <p className="mt-5 text-[0.75rem] leading-[1.5] text-(--text-muted)">Educational use only. This result is not a diagnosis and should not guide medical decisions.</p>
    </div> : <section className={`${panelClass} flex min-h-[327px] flex-col items-center justify-center p-8 text-center max-[480px]:p-5`} aria-labelledby="learning-empty-title">
      <div className="mb-6 grid size-16 flex-none place-items-center rounded-md border border-[#5925a7] bg-[#2e1677]"><img src="/images/learning/scan.svg" alt="" width="36" height="36" /></div>
      <h2 className="mb-[18px] text-[1.5rem] font-extrabold" id="learning-empty-title">{state === "running" ? "Analyzing your X-ray" : "Select an X-ray to begin"}</h2>
      <p className="m-0 text-[0.875rem] leading-[1.6] text-(--text-muted)">{state === "running" ? "Resolving the active release, verifying the model, and analyzing in your browser. You can reset at any time." : "Choose a built-in case or a local JPEG or PNG image, review the preview, then select Analyze to explore the model’s findings."}</p>
    </section>}
    <section className={`${panelClass} mt-7 min-h-[220px] p-7 max-[480px]:p-5`} aria-labelledby="learning-gallery-title">
      <h2 className="mb-6 flex items-center gap-[18px] text-[1.25rem] font-extrabold" id="learning-gallery-title"><img src="/images/learning/book.svg" alt="" width="28" height="28" /> Sample Gallery</h2>
      <XrayLibrary onSelect={(next) => { if (inputRef.current) inputRef.current.value = ""; choose(next); }} />
    </section>
    </div>
  </section>;
}
