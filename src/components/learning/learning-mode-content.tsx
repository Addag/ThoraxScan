import Image from "next/image";

import { PageHeading, PageMain } from "@/components/dashboard-ui";
import { LearningModeAnalyzer } from "./learning-mode-analyzer";

export function LearningModeContent() {
  return (
    <PageMain>
      <PageHeading title="Learning Mode" subtitle="Practice with the active model on built-in or local chest X-rays" />
      <section className="mb-6 overflow-hidden rounded-panel border border-(--border-shell) bg-(--surface-raised)" aria-labelledby="learning-intro-title">
        <div className="flex gap-5 p-6 max-[800px]:gap-3.5 max-[800px]:p-5 max-[480px]:flex-col">
          <div className="grid size-11 flex-none place-items-center rounded-control border border-[#5925a7] bg-[#2e1677]"><Image src="/images/learning/scan.svg" alt="" width={24} height={24} /></div>
          <div>
            <h2 className="mt-0 mb-2 text-title font-extrabold" id="learning-intro-title">Practice at your own pace</h2>
            <p className="m-0 max-w-[860px] text-body leading-relaxed text-(--text-secondary)">Select a frontal or lateral chest X-ray and explore the active model’s findings. Lateral results are less tested than frontal results. No grades — just learning. The application does not verify the image’s view.</p>
          </div>
        </div>
        <p className="m-0 flex items-center gap-3 border-t border-t-(color:--disclaimer-yellow) bg-(--warning-fill) px-6 py-2.5 text-caption leading-normal text-(--status-warning-text) max-[480px]:items-start max-[480px]:p-3">
          <Image className="flex-none" src="/images/learning/warning.svg" alt="" width={20} height={20} />
          <span><strong>Educational Disclaimer:</strong> ThoraxScan is a training and learning tool. AI outputs support guided learning and must not be used for clinical diagnosis or patient care.</span>
        </p>
      </section>
      {/* The result heading takes focus after analysis, so headings and summaries need a visible focus ring here. */}
      <div className="[&_:is(summary,h2):focus-visible]:outline-3 [&_:is(summary,h2):focus-visible]:outline-offset-4 [&_:is(summary,h2):focus-visible]:outline-(--focus-ring)">
        <LearningModeAnalyzer />
      </div>
    </PageMain>
  );
}
