"use client";

import { useId, useState } from "react";
import type { AttentionHeatmap as Heatmap } from "@/lib/inference/attention";

export function AttentionHeatmap({ imageUrl, attention, title = "Attention overlay" }: { imageUrl: string | null; attention: Heatmap; title?: string }) {
  const titleId = useId();
  const [enabled, setEnabled] = useState(true);
  const [opacity, setOpacity] = useState(0.55);
  if (attention.status !== "ready") return <p className="m-0 px-4 py-3.5 text-[12px] leading-[1.55] text-[#c7d4e8]">This model release does not export attention data. Prediction results are still available.</p>;
  return <section aria-labelledby={titleId} className="attention-heatmap">
    <h3 id={titleId}>{title}</h3>
    <p>This global, class-agnostic overlay shows the relative internal attention the model assigned across the image during this inference. Warmer colors indicate higher relative attention within this image. It does not identify a lesion, explain a specific finding, or confirm disease location.</p>
    {imageUrl ? <div style={{ position: "relative", maxWidth: 448 }}>
      {/* Native image keeps private signed and local blob URLs out of an image proxy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Chest X-ray used for this inference" style={{ display: "block", width: "100%", filter: "grayscale(1)" }} />
      {enabled ? <svg aria-hidden="true" viewBox="0 0 7 7" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}>
        {attention.values.map((value, index) => <rect key={index} x={index % 7} y={Math.floor(index / 7)} width="1" height="1" fill={`rgb(${80 + 175 * value}, ${15 + 185 * value}, ${110 - 90 * value})`} />)}
      </svg> : null}
    </div> : <p>Original image unavailable. The normalized attention data remains available below.</p>}
    <label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Show attention overlay</label>
    <label>Overlay opacity <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={event => setOpacity(Number(event.target.value))} /> {Math.round(opacity * 100)}%</label>
    <div aria-hidden="true" style={{ height: 12, maxWidth: 448, background: "linear-gradient(to right, rgb(80,15,110), rgb(255,200,20))" }} />
    <p>Lower relative attention → Higher relative attention</p>
    <details><summary>Method and 7×7 data</summary>
      <p>Four-layer attention rollout, averaged over queries, normalized per image. These values are relative attention, not probabilities.</p>
      <div style={{ overflowX: "auto" }}><table>
        <caption>Normalized attention values, rows top to bottom and columns left to right</caption>
        <thead><tr><th scope="col">Row</th>{Array.from({ length: 7 }, (_, col) => <th key={col} scope="col">{col + 1}</th>)}</tr></thead>
        <tbody>{Array.from({ length: 7 }, (_, row) => <tr key={row}><th scope="row">{row + 1}</th>{attention.values.slice(row * 7, row * 7 + 7).map((value, col) => <td key={col}>{value.toFixed(3)}</td>)}</tr>)}</tbody>
      </table></div>
    </details>
  </section>;
}
