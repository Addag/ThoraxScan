import Link from "next/link";

import { AttentionHeatmap } from "@/components/attention-heatmap";
import { PageHeading, PageMain } from "@/components/dashboard-ui";
import { readyAttention } from "@/lib/inference/attention";

// Hand-picked display values, not inference results for the sample X-ray.
export const illustrativeAttention = readyAttention([
  0.00, 0.05, 0.12, 0.18, 0.14, 0.06, 0.02,
  0.04, 0.20, 0.38, 0.46, 0.34, 0.18, 0.05,
  0.10, 0.36, 0.62, 0.74, 0.58, 0.28, 0.08,
  0.14, 0.44, 0.78, 1.00, 0.82, 0.40, 0.12,
  0.12, 0.38, 0.68, 0.86, 0.70, 0.32, 0.10,
  0.06, 0.22, 0.42, 0.54, 0.40, 0.20, 0.04,
  0.01, 0.08, 0.16, 0.24, 0.18, 0.08, 0.00,
]);

export function AttentionMapsContent({ role }: { role: "student" | "professor" }) {
  return (
    <PageMain>
      <PageHeading
        title="Attention Maps"
        subtitle="Visual explanations of Vision Transformer patch attention — see where the model's attention was concentrated."
      />

      <section className="mb-8 rounded-[10px] border border-[#ba0000] bg-[rgba(185,0,0,0.18)] px-6 py-5 max-[600px]:px-4" aria-labelledby="attention-how-title">
        <h2 className="mt-0 mb-4 text-[1.0625rem] text-[#ff6b6b] light:text-(--status-error-text)" id="attention-how-title">How Attention Maps Work</h2>
        <ol className="m-0 grid list-inside list-decimal grid-cols-3 gap-5 p-0 text-[0.8125rem] leading-[1.65] text-[#e8d6dc] light:text-(--text-secondary) max-[800px]:grid-cols-1 max-[800px]:gap-2">
          <li>The input image is split into a 7×7 grid of patches.</li>
          <li>Four-layer attention rollout combines attention across the model’s layers.</li>
          <li>Values are normalized per image. Warmer colors mean higher relative attention.</li>
        </ol>
      </section>

      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-8 max-[800px]:grid-cols-1 max-[800px]:gap-6">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-[10px] border border-[#91918c] light:border-(--border-strong) bg-(--glass-inset)" aria-labelledby="attention-example-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#454951] light:border-(--border-subtle) px-4 py-3.5">
              <h2 className="m-0 text-[1rem]" id="attention-example-title">Attention Maps Explanation</h2>
              <span className="rounded-full bg-[#10065a] light:bg-(--surface-raised) px-5 py-1 text-[0.75rem]">Sample Case</span>
            </div>
            <AttentionHeatmap
              className="p-4 [&_label]:flex-wrap"
              imageUrl="/images/chexpert/cxp-001.jpg"
              attention={illustrativeAttention}
              title="Illustrative example — not model output"
              illustrative
            />
          </section>

          <section className="rounded-[10px] border border-[#91918c] light:border-(--border-strong) bg-(--glass-inset) p-5" aria-labelledby="attention-reference-title">
            <h2 className="mt-0 mb-4 flex items-center gap-3 text-[1rem]" id="attention-reference-title">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-[#09f7ff] text-[#09f7ff] light:text-(--brand-blue-text)" aria-hidden="true">?</span>
              Quick Reference
            </h2>
            <ul className="m-0 list-disc space-y-2.5 pl-5 text-[0.8125rem] leading-[1.65] text-[#c8d5e8] light:text-(--text-secondary)">
              <li>7×7 grid: 49 values, one for each image patch.</li>
              <li>Relative attention within one image, not a disease probability or a scale for comparing images.</li>
              <li>Global and class-agnostic: the map is not specific to a predicted finding.</li>
              <li>Higher attention does not identify a lesion or disease location.</li>
              <li><Link className="font-semibold text-[#9fcfff] light:text-(--brand-blue-text) underline underline-offset-4" href={`/${role}/learning`}>Try your own image in Learning Mode</Link> to explore model-generated attention when available.</li>
            </ul>
          </section>
        </div>

        <div className="min-w-0 space-y-3.5">
          <section className="overflow-hidden rounded-[10px] border border-[#09f7ff] bg-(--glass-inset)" aria-labelledby="attention-definition-title">
            <h2 className="m-0 border-b border-[#454951] light:border-(--border-subtle) px-5 py-4 text-[1rem]" id="attention-definition-title">What is Attention Maps</h2>
            <div className="space-y-5 px-5 py-6 text-[0.875rem] leading-[1.75] text-[#d7e3f5] light:text-(--text-secondary)">
              <p className="m-0">An attention map visualizes how the Vision Transformer distributes internal attention across image patches. ThoraxScan combines four layers of attention using attention rollout and averages over queries to produce one global, class-agnostic map.</p>
              <p className="m-0">The 49 patch values are scaled from 0 to 1 within each image. They show relative attention, not probabilities or an explanation of a particular prediction. The sample here uses hand-picked values to demonstrate the display.</p>
              <aside className="mt-8 rounded-lg border border-[#0077ff] bg-[#150d59] light:bg-(--surface-raised) p-4" aria-labelledby="attention-friendly-title">
                <h3 className="mt-0 mb-3 text-[0.9375rem] font-semibold text-[#09f7ff] light:text-(--brand-blue-text)" id="attention-friendly-title">Student-Friendly Explanation</h3>
                <p className="m-0">Think of it as a spotlight on the image’s patches. Warmer colors (red) = higher relative attention. Cooler colors (blue) = lower.</p>
                <p className="mt-3 mb-0 font-semibold text-(--text-primary)">It doesn’t show where disease is.</p>
              </aside>
            </div>
          </section>

          <a className="ml-auto block w-fit min-w-[200px] rounded-[10px] bg-[#0077ff] px-8 py-3 text-center text-[1.25rem] font-extrabold text-white no-underline hover:bg-[#0067dd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring) max-[800px]:w-full" href="/guides/attention-maps.pdf" target="_blank" rel="noopener noreferrer">PDF Guide<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
    </PageMain>
  );
}
