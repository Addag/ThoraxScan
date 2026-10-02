import Image from "next/image";

import { LearningModeAnalyzer } from "./learning-mode-analyzer";

export function LearningModeContent() {
  return (
    <main className="mx-auto w-[min(1090px,calc(100%-64px))] flex-1 pt-[30px] pb-12 max-[1000px]:w-[calc(100%-40px)] max-[480px]:w-[calc(100%-28px)] max-[480px]:pt-6 [&_:is(summary,h2):focus-visible]:outline-3 [&_:is(summary,h2):focus-visible]:outline-offset-4 [&_:is(summary,h2):focus-visible]:outline-white">
      <h1 className="mt-0 mb-8 text-[28px] font-extrabold max-[800px]:mb-6">Learning Mode</h1>
      <section className="mb-[34px] overflow-hidden rounded-[10px] border border-[#49368b] bg-[#1a1039] max-[800px]:mb-6" aria-labelledby="learning-intro-title">
        <div className="flex gap-5 px-6 py-5 max-[800px]:gap-3.5 max-[800px]:p-[18px] max-[480px]:flex-col">
          <div className="grid h-10 w-11 flex-none place-items-center rounded-md border border-[#5925a7] bg-[#2e1677]"><Image src="/images/learning/scan.svg" alt="" width={24} height={24} /></div>
          <div>
            <h2 className="mt-0 mb-3 text-[27px] font-extrabold max-[800px]:text-[24px]" id="learning-intro-title">AI Learning Mode</h2>
            <p className="m-0 max-w-[860px] text-[14px] leading-[1.65] text-(--text-secondary)">Practice chest X-ray interpretation at your own pace. Select a frontal chest X-ray and explore the active model’s findings. No grades — just learning. The application does not verify the image’s view.</p>
          </div>
        </div>
        <p className="m-0 flex items-center gap-3 border-t border-t-(color:--disclaimer-yellow) bg-(--warning-fill) px-[18px] py-2.5 text-[12px] leading-[1.5] text-[#ffe28a] max-[480px]:items-start max-[480px]:p-3">
          <Image className="flex-none" src="/images/learning/warning.svg" alt="" width={20} height={20} />
          <span><strong>Educational Disclaimer:</strong> ThoraxScan is a training and learning tool. AI outputs support guided learning and must not be used for clinical diagnosis or patient care.</span>
        </p>
      </section>
      <LearningModeAnalyzer />
    </main>
  );
}
