import Image from "next/image";
import Link from "next/link";

import { AttentionHeatmap } from "@/components/attention-heatmap";
import { illustrativeAttention } from "@/components/learning/attention-maps-content";
import { primaryButtonBase } from "@/components/primary-button";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { TechnicalOverview } from "@/components/technical-overview";
import { DocsSection } from "@/components/docs-section";
import { LandingFooter, LandingHeader, glassCard, secondaryPill, sectionLead, sectionShell, sectionTitle } from "@/components/landing-ui";

const workflowCallouts = [
  { color: "purple", label: "Interpret first" },
  { color: "blue", label: "Review AI feedback" },
  { color: "green", label: "Learn with faculty guidance" },
] as const;

const calloutStyles = {
  purple: { position: "top-[179px] left-[-48px]", border: "border-[rgb(194_157_255/56%)]" },
  blue: { position: "top-0 left-[434px]", border: "border-[rgb(112_184_255/56%)]" },
  green: { position: "top-[349px] left-[45px]", border: "border-[rgb(103_222_179/56%)]" },
} as const;

// The hero callouts' colours carry over: purple interpret, blue AI feedback, green faculty; amber marks the lock-in.
const learningLoop = [
  { title: "Interpret first", body: "Study the case and record your findings, whether it looks normal or abnormal, and the relevant region.", ring: "border-[rgb(194_157_255/72%)] text-[#d9c4ff]" },
  { title: "Submit", body: "Your final answer locks. It can't be edited afterwards, so the feedback always answers your own reading.", ring: "border-[rgb(255_214_54/72%)] text-[#ffe082]" },
  { title: "Review AI feedback", body: "Unlocks only after you submit: likely findings, possible findings, every label the model scores, and its attention heatmap.", ring: "border-[rgb(112_184_255/72%)] text-[#b9dbff]" },
  { title: "Faculty evaluation", body: "Your professor reviews the submission and gives the evaluation that counts.", ring: "border-[rgb(103_222_179/72%)] text-[#a9f0d4]" },
] as const;

const roles = [
  {
    title: "For Students",
    image: { src: "/images/student-role.png", width: 125, height: 88 },
    points: [
      "Join your class workspace with an invitation code from your professor.",
      "Complete activities and get AI feedback once you submit.",
      "Practice anytime in Learning Mode with the built-in X-ray library; practice results stay in your browser.",
      "Learn what attention maps can and can't tell you.",
    ],
  },
  {
    title: "For Professors",
    image: { src: "/images/professor-role.png", width: 86, height: 83 },
    points: [
      "Apply for a professor account; an administrator approves it.",
      "Create workspaces and invitation codes for your classes.",
      "Publish activities from your own X-rays or the built-in library.",
      "Review submissions and evaluate each student's reading.",
    ],
  },
] as const;

const modelFacts = [
  "SqueezeViT, a compact vision transformer, distilled from a larger FastViT teacher.",
  "Trained on CheXpert frontal and lateral chest X-rays to score 14 findings.",
  "Runs in your browser with ONNX Runtime Web: WebGPU where available, WebAssembly otherwise.",
  "The attention heatmap is a 7×7 patch grid from four-layer attention rollout. It is global and class-agnostic, not a lesion locator.",
] as const;

// From map/objects/inference/model-training.md (v5 release). Update when the active release changes.
const modelScore = {
  value: "0.881",
  label: "mean AUC across the five CheXpert competition labels",
  source: "Release v5, measured on the 234-image CheXpert validation set, which the model was neither trained nor tuned on.",
};

const loginButton = `${primaryButtonBase} h-[53px] w-[206px] gap-[7px] rounded-[12px] border border-[rgb(168_211_255/48%)] [background:var(--landing-login-bg)] shadow-(--landing-login-shadow) text-[1.575rem] leading-none hover:[background:var(--landing-login-bg-hover)] focus-visible:outline-3 focus-visible:outline-[#c5e3ff] focus-visible:outline-offset-[5px]`;

export default function Home() {
  return (
    <div data-theme="dark" data-landing className="relative overflow-x-clip">
      <RevealOnScroll />
      <LandingHeader />

      <main>
        <section className="relative min-h-[max(819px,calc(100svh-81px))] overflow-hidden stacked:flex stacked:min-h-[calc(100svh-81px)] stacked:flex-col stacked:overflow-visible narrow:min-h-[calc(100svh-73px)]" aria-labelledby="landing-title">
          <div className="relative mx-auto min-h-[820px] max-w-[1440px] stacked:min-h-0 stacked:w-full tablet:grid tablet:grid-cols-[minmax(0,1fr)_minmax(320px,507px)] tablet:items-start tablet:gap-[clamp(24px,3vw,48px)] tablet:px-[clamp(24px,5vw,72px)] tablet:pt-[clamp(64px,7vw,88px)] tablet:pb-14 narrow:flex narrow:flex-col narrow:px-6 narrow:pt-[72px] narrow:pb-[52px]">
            <div className="absolute top-[108px] left-[6.25%] flex h-[25px] w-[479px] items-center justify-center rounded-[15px] border border-[rgb(123_185_255/38%)] [background:linear-gradient(120deg,rgb(92_155_255/20%),rgb(37_75_145/14%))] text-[1rem] font-semibold leading-[1.4375rem] text-[#b9dbff] text-center backdrop-blur-[20px] backdrop-saturate-[140%] shadow-(--glass-inset-shadow) stacked:static stacked:h-auto stacked:min-h-[25px] stacked:w-[min(100%,479px)] stacked:px-2.5 stacked:py-1 stacked:leading-[1.2] tablet:min-w-0 tablet:col-span-full tablet:justify-self-start tablet:text-[clamp(0.75rem,1.2vw,1rem)] narrow:self-center narrow:text-[0.75rem] no-backdrop:[background:#14243e]">
              SqueezeViT | ONNX Runtime Web | Attention Heatmap XAI
            </div>

            <div className="absolute top-[214px] left-[8.0556%] w-[604px] stacked:static stacked:w-full tablet:min-w-0 tablet:mt-0 narrow:mt-[54px]">
              <h1 className="m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[4rem] font-extrabold tracking-[-2.6px] leading-[1.28] text-(--text-primary) stacked:leading-[1.15] tablet:text-[clamp(2.875rem,5.3vw,4rem)] tablet:tracking-[-2px] narrow:text-[clamp(2.625rem,11vw,4rem)] narrow:tracking-[-1.8px]" id="landing-title">
                <span className="block">AI-Assisted</span>
                <span className="block text-brand">Chest X-Ray</span>
                <span className="block">Learning Platform</span>
              </h1>
              <p className="mt-[22px] w-[390px] text-[1rem] font-semibold leading-[1.35] text-[#c3d0e2] stacked:mt-[26px] stacked:leading-[1.25] tablet:w-[min(100%,340px)] narrow:w-[min(100%,390px)]">
                ThoraxScan is an educational LMS for Radiologic Technology students. Practice chest X-ray interpretation through professor-guided activities, with AI-powered Attention Heatmap feedback after submission.
              </p>
              <Link className={`${loginButton} mt-[42px] ml-2 stacked:mt-[34px] stacked:ml-0 stacked:w-[min(206px,100%)] stacked:text-[1.4rem]`} href="/login">
                Log in <span aria-hidden="true">→</span>
              </Link>
            </div>

            <figure className="absolute top-[186px] left-[55.5556%] m-0 h-[430px] w-[580px] stacked:h-auto stacked:w-[min(100%,507px)] tablet:static tablet:min-w-0 tablet:justify-self-end narrow:relative narrow:top-auto narrow:left-auto narrow:mx-auto narrow:mt-[82px] narrow:transform-none" aria-labelledby="xray-caption">
              <div className="absolute top-10 left-0 h-[361px] w-[507px] overflow-hidden rounded-[22px] border border-[rgb(175_207_255/32%)] [background:linear-gradient(135deg,rgb(207_228_255/18%),rgb(66_100_166/8%))] backdrop-blur-[20px] backdrop-saturate-[140%] shadow-(--landing-xray-shadow) stacked:relative stacked:top-auto stacked:left-auto stacked:h-auto stacked:w-full stacked:aspect-[507/361] no-backdrop:[background:#14243e]">
                <Image
                  className="absolute top-[14px] left-[14px] block h-[calc(100%-28px)] w-[calc(100%-28px)] rounded-[12px] object-cover"
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
              <ol className="absolute inset-0 z-[1] m-0 list-none p-0 stacked:static stacked:mt-[18px] stacked:grid stacked:grid-cols-1 stacked:gap-2.5" aria-label="ThoraxScan learning workflow">
                {workflowCallouts.map((callout, index) => (
                  <li className={`absolute flex h-[81px] w-[146px] flex-col items-center justify-center gap-1 rounded-[16px] border p-2.5 [background:linear-gradient(135deg,rgb(43_65_105/78%),rgb(10_24_49/72%))] text-center text-[0.75rem] font-semibold leading-[1.15] text-[#f2f6ff] backdrop-blur-[12px] shadow-(--landing-callout-shadow) ${calloutStyles[callout.color].position} ${calloutStyles[callout.color].border} stacked:static stacked:h-auto stacked:min-h-[58px] stacked:w-full stacked:flex-row stacked:justify-start stacked:px-4 stacked:py-[13px] stacked:text-left no-backdrop:[background:#14243e]`} key={callout.label}>
                    <span className="[font-family:var(--font-inter),Arial,sans-serif] text-[0.875rem] font-extrabold stacked:w-6 stacked:flex-[0_0_24px] stacked:text-center">{index + 1}</span>
                    <span>{callout.label}</span>
                  </li>
                ))}
              </ol>
            </figure>
          </div>

          <a className={`${secondaryPill} absolute bottom-[78px] left-1/2 z-[2] -translate-x-1/2 stacked:static stacked:mt-auto stacked:mb-8 stacked:translate-x-0 stacked:self-center`} href="#how-it-works">
            See how it works <span aria-hidden="true">↓</span>
          </a>

          <aside className="absolute inset-x-0 bottom-0 z-[2] flex min-h-[54px] items-start border border-[rgb(244_195_1/38%)] bg-[rgb(38_33_18/78%)] px-[31px] pt-1.5 pb-[5px] text-[1rem] font-semibold leading-[1.15] text-[#ffe082] backdrop-blur-[20px] backdrop-saturate-[140%] shadow-[inset_0_1px_0_rgb(244_195_1/8%)] stacked:static stacked:min-h-0 stacked:px-[18px] stacked:py-2.5 stacked:text-[0.8125rem] stacked:leading-[1.2] no-backdrop:[background:#262112]" aria-label="Educational disclaimer">
            <Image
              className="mt-2 mr-[18px] h-6 w-6 flex-[0_0_24px] stacked:mt-[5px] stacked:mr-[13px] stacked:h-5 stacked:w-5 stacked:basis-5"
              src="/images/danger-triangle.svg"
              alt=""
              width={24}
              height={24}
            />
            <p className="m-0 max-w-[1294px] tablet:min-w-0">
              <strong className="font-extrabold text-(--disclaimer-yellow)">Educational Disclaimer</strong>: ThoraxScan is a training and learning tool for Radiologic Technology students only. All AI outputs are for guided learning and must not be used for clinical diagnosis or patient care.
            </p>
            <span className="ml-auto flex items-center gap-3 self-center pl-6 whitespace-nowrap text-[0.75rem] font-semibold text-[#d6e1f0] underline underline-offset-2">
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms">Terms</Link>
            </span>
          </aside>
        </section>

        <section id="how-it-works" className={sectionShell} aria-labelledby="loop-title">
          <h2 className={sectionTitle} id="loop-title" data-reveal>How ThoraxScan works</h2>
          <p className={sectionLead} data-reveal>Every activity follows the same four steps. You commit to your own reading first; the AI and your professor respond after. AI feedback supports learning and never replaces a diagnosis.</p>
          <ol className="mt-12 mb-0 grid list-none grid-cols-4 gap-5 p-0 stacked:grid-cols-2 max-[640px]:grid-cols-1">
            {learningLoop.map((step, index) => (
              <li className={`${glassCard} flex flex-col gap-3 p-6`} key={step.title} data-reveal>
                <span className={`grid size-11 place-items-center rounded-full border-2 [font-family:var(--font-inter),Arial,sans-serif] text-[1.125rem] font-extrabold ${step.ring}`} aria-hidden="true">{index + 1}</span>
                <h3 className="m-0 text-[1.25rem] font-extrabold text-(--text-primary)">{step.title}</h3>
                <p className="m-0 text-[0.9375rem] leading-[1.55] text-[#c3d0e2]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={sectionShell} aria-labelledby="roles-title">
          <h2 className={sectionTitle} id="roles-title" data-reveal>One platform, two roles</h2>
          <p className={sectionLead} data-reveal>Professors run the classes; students practice and learn inside them.</p>
          <div className="mt-12 grid grid-cols-2 gap-5 narrow:grid-cols-1">
            {roles.map((role) => (
              <article className={`${glassCard} p-[clamp(24px,3vw,36px)]`} key={role.title} data-reveal>
                <div className="flex items-center gap-4">
                  <Image className="h-14 w-auto" src={role.image.src} alt="" width={role.image.width} height={role.image.height} />
                  <h3 className="m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[1.625rem] font-extrabold text-(--text-primary)">{role.title}</h3>
                </div>
                <ul className="mt-6 mb-0 list-disc space-y-3 pl-5 text-[1rem] leading-[1.55] text-[#c3d0e2] marker:text-brand">
                  {role.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={sectionShell} aria-labelledby="model-title">
          <div className="grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-start gap-[clamp(24px,4vw,56px)] narrow:grid-cols-1">
            <div className="min-w-0">
              <h2 className={sectionTitle} id="model-title" data-reveal>Under the hood</h2>
              <p className="mt-8 mb-0 flex flex-wrap items-baseline gap-x-4 gap-y-1" data-reveal>
                <span className="[font-family:var(--font-inter),Arial,sans-serif] text-[3.5rem] font-extrabold leading-none tracking-[-2px] text-brand">{modelScore.value}</span>
                <span className="text-[1.0625rem] font-semibold text-(--text-primary)">{modelScore.label}</span>
              </p>
              <p className="mt-2 mb-0 max-w-[560px] text-[0.8125rem] leading-[1.5] text-(--text-muted)" data-reveal>{modelScore.source}</p>
              <ul className="mt-8 mb-0 list-disc space-y-3 pl-5 text-[1rem] leading-[1.55] text-[#c3d0e2] marker:text-brand" data-reveal>
                {modelFacts.map((fact) => <li key={fact}>{fact}</li>)}
              </ul>
              {/* Wrapped: the pill's own transition utility would override the reveal transition. */}
              <div className="mt-8" data-reveal>
                <a className={secondaryPill} href="/guides/attention-maps.pdf" target="_blank" rel="noopener noreferrer">
                  Read the attention maps guide (PDF)<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
            <div className="min-w-0" data-reveal>
              <AttentionHeatmap
                className={`${glassCard} p-5 [&_label]:flex-wrap`}
                imageUrl="/images/chexpert/cxp-001.jpg"
                attention={illustrativeAttention}
                title="Illustrative example — not model output"
                illustrative
              />
            </div>
          </div>
        </section>

        <TechnicalOverview />

        <DocsSection />

        <section className={`${sectionShell} text-center`} aria-labelledby="start-title">
          <h2 className={sectionTitle} id="start-title" data-reveal>Ready to practice?</h2>
          <p className={`${sectionLead} mx-auto`} data-reveal>Sign in with your ThoraxScan account, or create one as a student or professor.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4" data-reveal>
            <Link className={loginButton} href="/login">
              Log in <span aria-hidden="true">→</span>
            </Link>
            <Link className={`${secondaryPill} h-[53px]`} href="/register">Create an account</Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
