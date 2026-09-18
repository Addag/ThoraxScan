import Image from "next/image";

import { LearningModeAnalyzer } from "./learning-mode-analyzer";

export function LearningModeContent() {
  return (
    <main className="learning-page">
      <h1>Learning Mode</h1>
      <section className="learning-intro" aria-labelledby="learning-intro-title">
        <div className="learning-intro-body">
          <div className="learning-scan-icon"><Image src="/images/learning/scan.svg" alt="" width={24} height={24} /></div>
          <div>
            <h2 id="learning-intro-title">AI Learning Mode</h2>
            <p>Practice chest X-ray interpretation at your own pace. Select a frontal chest X-ray and explore the active model’s findings. No grades — just learning. The application does not verify the image’s view.</p>
          </div>
        </div>
        <p className="learning-education-note">
          <Image src="/images/learning/warning.svg" alt="" width={20} height={20} />
          <span><strong>Educational Disclaimer:</strong> ThoraxScan is a training and learning tool. AI outputs support guided learning and must not be used for clinical diagnosis or patient care.</span>
        </p>
      </section>
      <LearningModeAnalyzer />
    </main>
  );
}
