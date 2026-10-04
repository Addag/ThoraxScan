import Image from "next/image";
import Link from "next/link";

import { primaryButtonBase } from "@/components/primary-button";
import { Brand } from "@/components/brand";

const workflowCallouts = [
  { color: "purple", label: "Interpret first" },
  { color: "blue", label: "Review AI feedback" },
  { color: "green", label: "Learn with faculty guidance" },
] as const;

export default function Home() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <Brand variant="landing" />
        <span className="header-divider" aria-hidden="true" />
      </header>

      <main className="landing-hero">
        <div className="hero-tag">
          SqueezeViT | ONNX Runtime Web | Attention Heatmap XAI
        </div>

        <section className="hero-copy" aria-labelledby="landing-title">
          <h1 id="landing-title">
            <span>AI-Assisted</span>
            <span className="text-brand">Chest X-Ray</span>
            <span>Learning Platform</span>
          </h1>
          <p>
            ThoraxScan is an educational LMS for Radiologic Technology students. Practice chest X-ray interpretation through professor-guided activities, with AI-powered Attention Heatmap feedback after submission.
          </p>
          <Link className={`${primaryButtonBase} landing-login`} href="/login">
            Log in <span aria-hidden="true">→</span>
          </Link>
        </section>

        <figure className="landing-xray" aria-labelledby="xray-caption">
          <div className="xray-card">
            <Image
              src="/images/xray-sample.png"
              alt="Illustrative frontal chest X-ray preview"
              width={507}
              height={338}
              priority
            />
          </div>
          <figcaption id="xray-caption" className="sr-only">
            Illustrative educational preview. ThoraxScan outputs support learning and are not clinical diagnoses.
          </figcaption>
          <ol className="workflow-callouts" aria-label="ThoraxScan learning workflow">
            {workflowCallouts.map((callout, index) => (
              <li className={`workflow-callout workflow-callout--${callout.color}`} key={callout.label}>
                <span className="workflow-callout__number">{index + 1}</span>
                <span>{callout.label}</span>
              </li>
            ))}
          </ol>
        </figure>
      </main>

      <footer className="educational-disclaimer">
        <Image
          className="disclaimer-icon"
          src="/images/danger-triangle.svg"
          alt=""
          width={24}
          height={24}
        />
        <p>
          <strong>Educational Disclaimer</strong>: ThoraxScan is a training and learning tool for Radiologic Technology students only. All AI outputs are for guided learning and must not be used for clinical diagnosis or patient care.
        </p>
      </footer>
    </div>
  );
}

