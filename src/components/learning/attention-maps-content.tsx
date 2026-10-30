import { button } from "@/components/controls";
import Link from "next/link";

import { AttentionHeatmap } from "@/components/attention-heatmap";
import { PageHeading, PageMain } from "@/components/dashboard-ui";
import { readyClassActivation } from "@/lib/inference/attention";
import sample from "./sample-heatmap.json";

// Real per-finding maps for the sample case, saved from the CAM release's model output (see sample.caseId and sample.releaseId).
export const sampleHeatmap = readyClassActivation(sample.values);
export const sampleHeatmapLabels = sample.labels;

export function AttentionMapsContent({ role }: { role: "student" | "professor" }) {
  return (
    <PageMain>
      <PageHeading
        title="Attention Maps"
        subtitle="Finding heatmaps show where in the image the model found the evidence behind each likely or possible finding."
      />

      <section className="mb-6 rounded-panel border border-brand bg-[rgba(0,119,255,0.12)] p-6 max-[600px]:p-4" aria-labelledby="attention-how-title">
        <h2 className="mt-0 mb-4 text-lead font-extrabold text-(--brand-blue-text)" id="attention-how-title">How finding heatmaps work</h2>
        <ol className="m-0 grid list-inside list-decimal grid-cols-3 gap-5 p-0 text-small leading-relaxed text-(--text-secondary) max-[800px]:grid-cols-1 max-[800px]:gap-2">
          <li>The model’s last feature map covers the image as a 7×7 grid, smoothed to 14×14 for the heatmap.</li>
          <li>For each finding, the classifier’s own weights for that finding score every cell (a class activation map).</li>
          <li>Negative evidence is clipped and each map is scaled 0–1. Warmer colors mean more evidence for the selected finding.</li>
        </ol>
      </section>

      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-8 max-[800px]:grid-cols-1 max-[800px]:gap-6">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-panel border border-(--border-strong) bg-(--glass-inset)" aria-labelledby="attention-example-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-subtle) px-4 py-3.5">
              <h2 className="m-0 text-lead" id="attention-example-title">Finding heatmap example</h2>
              <span className="rounded-full bg-(--surface-raised) px-5 py-1 text-caption">Sample case</span>
            </div>
            <AttentionHeatmap
              className="p-4 [&_label]:flex-wrap"
              imageUrl="/images/chexpert/cxp-232.jpg"
              attention={sampleHeatmap}
              labels={sampleHeatmapLabels}
              title="Sample case: real model output"
            />
          </section>

          <section className="rounded-panel border border-(--border-strong) bg-(--glass-inset) p-5" aria-labelledby="attention-reference-title">
            <h2 className="mt-0 mb-4 text-lead" id="attention-reference-title">Quick reference</h2>
            <ul className="m-0 list-disc space-y-2.5 pl-5 text-small leading-relaxed text-(--text-secondary)">
              <li>One 14×14 map per finding; pick the finding from the list under the image.</li>
              <li>Relative evidence within one image, not a disease probability or a scale for comparing images.</li>
              <li>A hot region shows where the model looked for that finding, not a lesion outline or a measurement.</li>
              <li>Read the map together with the finding’s probability: a strong map for an unlikely finding is still unlikely.</li>
              <li><Link className="font-semibold text-(--brand-blue-text) underline underline-offset-4" href={`/${role}/learning`}>Try your own image in Learning Mode</Link> to see heatmaps for your own findings.</li>
            </ul>
          </section>
        </div>

        <div className="min-w-0 space-y-3.5">
          <section className="overflow-hidden rounded-panel border border-[#09f7ff] bg-(--glass-inset)" aria-labelledby="attention-definition-title">
            <h2 className="m-0 border-b border-(--border-subtle) px-5 py-4 text-lead" id="attention-definition-title">What is a finding heatmap?</h2>
            <div className="space-y-5 px-5 py-6 text-body leading-relaxed text-(--text-secondary)">
              <p>A finding heatmap is a class activation map (CAM). The model averages its final 7×7 feature map and weighs it to score each finding; applying that finding’s weights to every cell instead shows which parts of the image pushed its score up.</p>
              <p>Each finding gets its own map, so in this sample Cardiomegaly lights up over the heart, Edema across the lung fields, and Support Devices along the tube in the upper chest. Values are scaled from 0 to 1 within each map. The sample shows the model’s real output for this case.</p>
              <aside className="mt-8 rounded-lg border border-[#0077ff] bg-(--surface-raised) p-4" aria-labelledby="attention-friendly-title">
                <h3 className="mt-0 mb-3 text-lead font-semibold text-(--brand-blue-text)" id="attention-friendly-title">Student-friendly explanation</h3>
                <p className="m-0">Think of it as the model pointing at where it saw the evidence for one finding. Warmer colors (red) = more evidence. Cooler colors (blue) = little or none.</p>
                <p className="mt-3 mb-0 font-semibold text-(--text-primary)">It is a guide for where to look, not a diagnosis or a lesion outline.</p>
              </aside>
            </div>
          </section>

          <div className="flex justify-end"><a className={`${button("primary", "lg")} max-[800px]:w-full`} href="/guides/attention-maps.pdf" target="_blank" rel="noopener noreferrer">PDF Guide<span className="sr-only"> (opens in a new tab)</span></a></div>
        </div>
      </div>
    </PageMain>
  );
}
