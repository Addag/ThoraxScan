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

      <section className="mb-8 rounded-[10px] border border-[#ba0000] bg-[rgba(185,0,0,0.18)] px-6 py-5 max-[600px]:px-4" aria-labelledby="attention-how-title">
        <h2 className="mt-0 mb-4 text-[1.0625rem] text-[#ff6b6b] light:text-(--status-error-text)" id="attention-how-title">How Finding Heatmaps Work</h2>
        <ol className="m-0 grid list-inside list-decimal grid-cols-3 gap-5 p-0 text-[0.8125rem] leading-[1.65] text-[#e8d6dc] light:text-(--text-secondary) max-[800px]:grid-cols-1 max-[800px]:gap-2">
          <li>The model’s last feature map covers the image as a 14×14 grid.</li>
          <li>For each finding, the classifier’s own weights for that finding score every cell (a class activation map).</li>
          <li>Negative evidence is clipped and each map is scaled 0–1. Warmer colors mean more evidence for the selected finding.</li>
        </ol>
      </section>

      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-8 max-[800px]:grid-cols-1 max-[800px]:gap-6">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-[10px] border border-[#91918c] light:border-(--border-strong) bg-(--glass-inset)" aria-labelledby="attention-example-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#454951] light:border-(--border-subtle) px-4 py-3.5">
              <h2 className="m-0 text-[1rem]" id="attention-example-title">Finding Heatmap Example</h2>
              <span className="rounded-full bg-[#10065a] light:bg-(--surface-raised) px-5 py-1 text-[0.75rem]">Sample Case</span>
            </div>
            <AttentionHeatmap
              className="p-4 [&_label]:flex-wrap"
              imageUrl="/images/chexpert/cxp-001.jpg"
              attention={sampleHeatmap}
              labels={sampleHeatmapLabels}
              title="Sample case: real model output"
            />
          </section>

          <section className="rounded-[10px] border border-[#91918c] light:border-(--border-strong) bg-(--glass-inset) p-5" aria-labelledby="attention-reference-title">
            <h2 className="mt-0 mb-4 flex items-center gap-3 text-[1rem]" id="attention-reference-title">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-[#09f7ff] text-[#09f7ff] light:text-(--brand-blue-text)" aria-hidden="true">?</span>
              Quick Reference
            </h2>
            <ul className="m-0 list-disc space-y-2.5 pl-5 text-[0.8125rem] leading-[1.65] text-[#c8d5e8] light:text-(--text-secondary)">
              <li>One 14×14 map per finding; pick the finding from the list under the image.</li>
              <li>Relative evidence within one image, not a disease probability or a scale for comparing images.</li>
              <li>A hot region shows where the model looked for that finding, not a lesion outline or a measurement.</li>
              <li>Read the map together with the finding’s probability: a strong map for an unlikely finding is still unlikely.</li>
              <li><Link className="font-semibold text-[#9fcfff] light:text-(--brand-blue-text) underline underline-offset-4" href={`/${role}/learning`}>Try your own image in Learning Mode</Link> to see heatmaps for your own findings.</li>
            </ul>
          </section>
        </div>

        <div className="min-w-0 space-y-3.5">
          <section className="overflow-hidden rounded-[10px] border border-[#09f7ff] bg-(--glass-inset)" aria-labelledby="attention-definition-title">
            <h2 className="m-0 border-b border-[#454951] light:border-(--border-subtle) px-5 py-4 text-[1rem]" id="attention-definition-title">What is a Finding Heatmap</h2>
            <div className="space-y-5 px-5 py-6 text-[0.875rem] leading-[1.75] text-[#d7e3f5] light:text-(--text-secondary)">
              <p className="m-0">A finding heatmap is a class activation map (CAM). The model averages its final 14×14 feature map and weighs it to score each finding; applying that finding’s weights to every cell instead shows which parts of the image pushed its score up.</p>
              <p className="m-0">Each finding gets its own map, so Cardiomegaly lights up around the heart while Support Devices follows the line or port. Values are scaled from 0 to 1 within each map. The sample shows the model’s real output for this case.</p>
              <aside className="mt-8 rounded-lg border border-[#0077ff] bg-[#150d59] light:bg-(--surface-raised) p-4" aria-labelledby="attention-friendly-title">
                <h3 className="mt-0 mb-3 text-[0.9375rem] font-semibold text-[#09f7ff] light:text-(--brand-blue-text)" id="attention-friendly-title">Student-Friendly Explanation</h3>
                <p className="m-0">Think of it as the model pointing at where it saw the evidence for one finding. Warmer colors (red) = more evidence. Cooler colors (blue) = little or none.</p>
                <p className="mt-3 mb-0 font-semibold text-(--text-primary)">It is a guide for where to look, not a diagnosis or a lesion outline.</p>
              </aside>
            </div>
          </section>

          <a className="ml-auto block w-fit min-w-[200px] rounded-[10px] bg-[#0077ff] px-8 py-3 text-center text-[1.25rem] font-extrabold text-white no-underline hover:bg-[#0067dd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring) max-[800px]:w-full" href="/guides/attention-maps.pdf" target="_blank" rel="noopener noreferrer">PDF Guide<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
    </PageMain>
  );
}
