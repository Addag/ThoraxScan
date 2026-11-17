"use client";

import { useId, useState } from "react";
import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { CAM_GRID, attentionGradient, labelActivation } from "@/lib/inference/attention";
import { paintedLabels } from "@/lib/submissions/validation";
import { drawOverlay } from "@/components/attention-heatmap";

const textClass = "m-0 text-caption leading-normal text-(--text-secondary)";

function Overlay({ imageUrl, values, caption, empty }: { imageUrl: string | null; values: number[] | null; caption: string; empty: string }) {
  return <figure className="m-0 grid min-w-0 content-start gap-2">
    <figcaption className="text-small font-semibold text-(--text-primary)">{caption}</figcaption>
    {imageUrl ? <div style={{ position: "relative" }}>
      {/* Native image keeps the private signed URL out of an image proxy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={`Chest X-ray with ${caption.toLowerCase()}`} style={{ display: "block", width: "100%", filter: "grayscale(1)" }} />
      {values ? <canvas aria-hidden="true" width={112} height={112} ref={(canvas) => drawOverlay(canvas, values, CAM_GRID)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55, pointerEvents: "none" }} /> : null}
    </div> : null}
    {!values ? <p className={textClass}>{empty}</p> : null}
  </figure>;
}

/**
 * The Student's own map next to the Professor-validated map (the AI's map, corrected by the Professor), one finding at a time.
 * A map is shown for a finding only when it has at least one marked cell.
 */
export function HeatmapComparison({ imageUrl, studentMap, studentLabels, keyMap, keyLabels, ownerLabel = "Your heatmap" }: {
  imageUrl: string | null;
  studentMap: number[] | null;
  studentLabels: readonly string[];
  keyMap: number[] | null;
  keyLabels: readonly string[];
  ownerLabel?: string;
}) {
  const titleId = useId();
  const options = ACTIVITY_AI_LABELS.filter((label) => label !== "No Finding" && (studentLabels.includes(label) || keyLabels.includes(label)));
  const [selected, setSelected] = useState<ActivityAILabel | null>(null);
  const current = selected && options.includes(selected) ? selected : options[0];
  if (!keyMap && !studentMap) return null;
  if (!current) return <p className={textClass}>This case has no findings, so there are no heatmaps to compare.</p>;
  const index = ACTIVITY_AI_LABELS.indexOf(current);
  const marked = (map: number[] | null, labels: readonly string[]) => map && paintedLabels(map, labels).includes(current) ? labelActivation(map, index) : null;
  return <section aria-labelledby={titleId} className="grid gap-2.5 text-(--text-primary)">
    <h3 className="m-0 text-lead font-extrabold" id={titleId}>Heatmaps side by side</h3>
    <p className={textClass}>Compare where the finding was marked. The validated heatmap starts from the AI&apos;s class activation map and may have been corrected by the Professor. Warmer colors (red) mark the finding. These are coarse 14×14 guides for where to look, not lesion outlines, measurements, or diagnoses.</p>
    <label className="flex items-center gap-[7px] text-caption text-(--text-secondary)">Finding
      <select className="min-h-[32px] max-w-full rounded-control border border-(--border-strong) bg-(--surface-sunken) px-[10px] text-caption text-(--text-primary)" value={current} onChange={(event) => setSelected(event.target.value as ActivityAILabel)}>
        {options.map((label) => <option key={label} value={label}>{label}</option>)}
      </select>
    </label>
    <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
      <Overlay imageUrl={imageUrl} values={marked(studentMap, studentLabels)} caption={ownerLabel} empty={studentLabels.includes(current) ? "No cells were marked for this finding." : "This finding was not selected."} />
      <Overlay imageUrl={imageUrl} values={marked(keyMap, keyLabels)} caption="Professor-validated heatmap" empty={keyLabels.includes(current) ? "No validated heatmap for this finding." : "This finding is not in the answer key."} />
    </div>
    <div aria-hidden="true" style={{ height: 12, background: attentionGradient }} />
    <p className={textClass}>Less evidence → More evidence</p>
  </section>;
}
