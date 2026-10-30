"use client";

import { useId, useState } from "react";
import { THORAXSCAN_LABELS } from "@/lib/inference/contract";
import { attentionColor, attentionGradient, labelActivation, upsampleAttention, type AttentionHeatmap as Heatmap } from "@/lib/inference/attention";

// Canvas resolution for the smoothed overlay; CSS scales it to the image.
const OVERLAY_SIZE = 112;
function drawOverlay(canvas: HTMLCanvasElement | null, values: number[], grid: number) {
  const context = canvas?.getContext("2d");
  if (!context) return;
  const image = context.createImageData(OVERLAY_SIZE, OVERLAY_SIZE);
  upsampleAttention(values, OVERLAY_SIZE, grid).forEach((value, index) => image.data.set([...attentionColor(value), 255], index * 4));
  context.putImageData(image, 0, 0);
}

type HeatmapLabel = { label: string; probability: number; predicted: boolean; possible: boolean };
// Without probabilities (the Professor projection keeps them private), every finding can be inspected.
const ALL_FINDINGS = THORAXSCAN_LABELS.filter(label => label !== "No Finding");
const textClass = "mx-0 mt-0 mb-2.5 text-caption leading-normal text-(--text-secondary)";
const controlClass = "mt-2.5 flex items-center gap-[7px] text-caption text-(--text-secondary)";

export function AttentionHeatmap({ imageUrl, attention, labels, title = "Attention overlay", illustrative = false, className = "" }: { imageUrl: string | null; attention: Heatmap; labels?: HeatmapLabel[]; title?: string; illustrative?: boolean; className?: string }) {
  const titleId = useId();
  const selectId = useId();
  const [enabled, setEnabled] = useState(true);
  const [opacity, setOpacity] = useState(0.55);
  const [selected, setSelected] = useState<string | null>(null);
  if (attention.status !== "ready") return <p className="m-0 px-4 py-3.5 text-caption leading-normal text-(--text-secondary)">This model release does not export attention data. Prediction results are still available.</p>;
  const perLabel = attention.kind === "per-label";
  // With probabilities, per-label maps are offered for likely then possible findings, each tier most probable first.
  const options: { label: string; text: string }[] = !perLabel ? [] : labels
    ? labels.filter(item => (item.predicted || item.possible) && item.label !== "No Finding").sort((a, b) => Number(b.predicted) - Number(a.predicted) || b.probability - a.probability)
      .map(item => ({ label: item.label, text: `${item.label} (${item.predicted ? "likely" : "possible"}, ${(item.probability * 100).toFixed(1)}%)` }))
    : ALL_FINDINGS.map(label => ({ label, text: label }));
  const current = options.find(item => item.label === selected) ?? options[0];
  if (perLabel && !current) return <section aria-labelledby={titleId} className={`text-(--text-primary) ${className}`}>
    <h3 className="mx-0 mt-0 mb-1.5 text-lead" id={titleId}>{title}</h3>
    <p className={textClass}>No finding met its threshold, so there is no finding-specific heatmap to show.</p>
  </section>;
  const grid = attention.width;
  const values = perLabel ? labelActivation(attention.values, THORAXSCAN_LABELS.indexOf(current.label as (typeof THORAXSCAN_LABELS)[number])) : attention.values;
  return <section aria-labelledby={titleId} className={`text-(--text-primary) ${className}`}>
    <h3 className="mx-0 mt-0 mb-1.5 text-lead" id={titleId}>{title}</h3>
    {perLabel
      ? <p className={textClass}>This class activation map shows where the model&apos;s evidence for <strong>{current.label}</strong> is strongest in this image. Warmer colors (red) mark more evidence relative to the rest of this image; cooler colors (blue) mark little or none. It is a coarse 14×14 guide for where to look, not a lesion outline, a measurement, or a diagnosis.</p>
      : <p className={textClass}>{illustrative ? "This illustrative overlay uses hand-picked values to demonstrate the global, class-agnostic attention display. These values are not model output for this X-ray." : "Legacy global attention: this class-agnostic overlay shows the relative internal attention the model assigned across the image during this inference."} Warmer colors (red) indicate higher relative attention within this image; cooler colors (blue) indicate lower. It does not identify a lesion, explain a specific finding, or confirm disease location.</p>}
    {perLabel ? <label className={controlClass} htmlFor={selectId}>Finding
      <select id={selectId} className="min-h-[32px] max-w-full rounded-control border border-(--border-strong) bg-(--surface-sunken) px-[10px] text-caption text-(--text-primary)" value={current.label} onChange={event => setSelected(event.target.value)}>
        {options.map(item => <option key={item.label} value={item.label}>{item.text}</option>)}
      </select>
    </label> : null}
    {imageUrl ? <div className="mt-2.5" style={{ position: "relative", maxWidth: 448 }}>
      {/* Native image keeps private signed and local blob URLs out of an image proxy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={illustrative ? "Sample chest X-ray for an illustrative attention overlay" : "Chest X-ray used for this inference"} style={{ display: "block", width: "100%", filter: "grayscale(1)" }} />
      {enabled ? <canvas aria-hidden="true" width={OVERLAY_SIZE} height={OVERLAY_SIZE} ref={canvas => drawOverlay(canvas, values, grid)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }} /> : null}
    </div> : <p className={textClass}>Original image unavailable. The normalized heatmap data remains available below.</p>}
    <label className={controlClass}><input className="size-[15px] accent-brand" type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Show heatmap overlay</label>
    <label className={controlClass}>Overlay opacity <input className="w-[min(180px,42vw)] accent-brand" type="range" min="0" max="1" step="0.05" value={opacity} onChange={event => setOpacity(Number(event.target.value))} /> {Math.round(opacity * 100)}%</label>
    <div aria-hidden="true" style={{ height: 12, maxWidth: 448, background: attentionGradient }} />
    <p className={textClass}>{perLabel ? `Less evidence for ${current.label} → More evidence for ${current.label}` : "Lower relative attention → Higher relative attention"}</p>
    <details className="mt-2.5 text-caption text-(--text-secondary)"><summary>Method and {grid}×{grid} data</summary>
      <p>{perLabel
        ? "Class activation map (CAM): the classifier's weights for this finding applied to the final feature map, negative evidence clipped to zero, then scaled so this finding's strongest cell is 1. The values are relative evidence within this image, not probabilities. A strong map does not mean the finding is present; check the finding's probability for that."
        : illustrative ? "Illustrative values only; no attention rollout was run for this example. Model-generated maps use four-layer attention rollout, averaged over queries, normalized per image." : "Four-layer attention rollout, averaged over queries, normalized per image. These values are relative attention, not probabilities."}{" "}The overlay is smoothed between cell centers for display; the underlying data is still this {grid}×{grid} grid.</p>
      <div style={{ overflowX: "auto" }}><table>
        <caption>{perLabel ? `Normalized ${current.label} evidence` : "Normalized attention values"}, rows top to bottom and columns left to right</caption>
        <thead><tr><th scope="col">Row</th>{Array.from({ length: grid }, (_, col) => <th key={col} scope="col">{col + 1}</th>)}</tr></thead>
        <tbody>{Array.from({ length: grid }, (_, row) => <tr key={row}><th scope="row">{row + 1}</th>{values.slice(row * grid, row * grid + grid).map((value, col) => <td key={col}>{value.toFixed(perLabel ? 2 : 3)}</td>)}</tr>)}</tbody>
      </table></div>
    </details>
  </section>;
}
