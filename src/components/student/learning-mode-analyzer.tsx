"use client";

import { useEffect, useRef, useState } from "react";
import { InferenceError, type InferenceErrorCode } from "@/lib/inference/errors";
import type { InferenceResult } from "@/lib/inference/runtime";

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

export function StudentLearningModeAnalyzer() {
  const [state, setState] = useState<AnalyzerState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const suppressedLabels = result?.labels.filter((item) => item.predicted && !result.findings.some((finding) => finding.label === item.label)) ?? [];

  return <section className="learning-analyzer" aria-labelledby="learning-analyzer-title">
    <div className="learning-analyzer__card">
      <h2 id="learning-analyzer-title">Analyze an image</h2>
      <p className="learning-analyzer__privacy">Your selected image stays in browser memory. The application contacts Supabase for the active release and downloads the model artifact.</p>
      <p>This is non-graded practice. Choose a frontal chest X-ray; the application does not verify the view.</p>
      <label className="learning-file-label" htmlFor="learning-image">Chest X-ray image (JPEG or PNG, up to 6 MiB)</label>
      <input ref={inputRef} id="learning-image" type="file" accept="image/jpeg,image/png" onChange={(event) => choose(event.target.files?.[0] ?? null)} />
      {/* A local object URL is never sent to an image optimization server. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {previewUrl && <img className="learning-preview" src={previewUrl} alt="Selected chest X-ray preview" />}
      <div className="learning-actions"><button type="button" onClick={run} disabled={!file || Boolean(validate(file)) || state === "running"}>Analyze</button><button type="button" className="learning-button-secondary" onClick={reset} disabled={state === "idle"}>Reset</button></div>
      <p className="learning-status" aria-live="polite">{state === "running" ? "Analyzing in this browser…" : state === "selected" ? "Image ready to analyze." : state === "success" ? "Analysis complete." : ""}</p>
      {error && <p className="learning-error" role="alert">{error}</p>}
    </div>

    {result && <div className="learning-result" aria-live="polite">
      <h2 tabIndex={-1} ref={resultHeadingRef}>Analysis result</h2>
      <section className="learning-findings" aria-labelledby="learning-findings-title"><h3 id="learning-findings-title">Thresholded findings</h3>{result.state === "no-threshold-match" ? <p>No finding met its configured threshold.</p> : <ul>{result.findings.map((finding) => <li key={finding.label}><strong>{finding.label}</strong><span>{(finding.probability * 100).toFixed(1)}% probability</span></li>)}</ul>}</section>
      {suppressedLabels.map((item) => <p className="learning-suppressed" key={item.label}>{item.label}: Suppressed by abnormal finding.</p>)}
      <details className="learning-labels"><summary>All {result.labels.length} labels</summary><ul>{result.labels.map((item) => <li key={item.label}><div><strong>{item.label}</strong><span>{item.predicted ? "Matched" : "Not matched"}{suppressedLabels.includes(item) ? " · Suppressed by abnormal finding" : ""}</span></div><span>Probability {(item.probability * 100).toFixed(2)}% · Release-supplied threshold {item.threshold}</span></li>)}</ul></details>
      <details className="learning-provenance"><summary>Release and execution provenance</summary><dl><dt>Release ID</dt><dd>{result.releaseId}</dd><dt>Execution provider</dt><dd>{result.executionProvider.toUpperCase()}</dd><dt>Manifest version</dt><dd>{result.manifestVersion}</dd><dt>Preprocessing version</dt><dd>{result.preprocessingVersion}</dd><dt>Threshold version</dt><dd>{result.thresholdVersion}</dd><dt>Application build</dt><dd>{result.applicationBuild}</dd><dt>Model SHA-256</dt><dd>{result.modelSha256}</dd><dt>Bundle SHA-256</dt><dd>{result.bundleSha256}</dd></dl></details>
      <p className="learning-disclaimer">Educational use only. This result is not a diagnosis and should not guide medical decisions.</p>
    </div>}
  </section>;
}
