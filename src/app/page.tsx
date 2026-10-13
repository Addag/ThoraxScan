import Image from "next/image";
import Link from "next/link";

import { primaryButtonBase } from "@/components/primary-button";
import { Brand } from "@/components/brand";

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

export default function Home() {
  return (
    <div className="relative min-h-[max(1024px,100svh)] overflow-hidden [background:var(--landing-bg)] stacked:min-h-svh stacked:overflow-visible">
      <header className="relative h-[81px] bg-(--glass-shell) backdrop-blur-[12px] shadow-[inset_0_-1px_0_rgb(255_255_255/8%)] narrow:h-[73px] no-backdrop:[background:#14243e]">
        <Brand variant="landing" />
        <span className="absolute inset-x-0 bottom-0 block h-px w-full [background:url('/images/header-divider.svg')_center/100%_1px_no-repeat]" aria-hidden="true" />
      </header>

      <main className="relative mx-auto min-h-[820px] max-w-[1440px] stacked:min-h-0 tablet:grid tablet:grid-cols-[minmax(0,1fr)_minmax(320px,507px)] tablet:items-start tablet:gap-[clamp(24px,3vw,48px)] tablet:px-[clamp(24px,5vw,72px)] tablet:pt-[clamp(64px,7vw,88px)] tablet:pb-14 narrow:flex narrow:flex-col narrow:px-6 narrow:pt-[72px] narrow:pb-[52px]">
        <div className="absolute top-[108px] left-[6.25%] flex h-[25px] w-[479px] items-center justify-center rounded-[15px] border border-[rgb(123_185_255/38%)] [background:linear-gradient(120deg,rgb(92_155_255/20%),rgb(37_75_145/14%))] text-[16px] font-semibold leading-[23px] text-[#b9dbff] text-center backdrop-blur-[20px] backdrop-saturate-[140%] shadow-(--glass-inset-shadow) stacked:static stacked:h-auto stacked:min-h-[25px] stacked:w-[min(100%,479px)] stacked:px-2.5 stacked:py-1 stacked:leading-[1.2] tablet:min-w-0 tablet:col-span-full tablet:justify-self-start tablet:text-[clamp(12px,1.2vw,16px)] narrow:self-center narrow:text-[12px] no-backdrop:[background:#14243e]">
          SqueezeViT | ONNX Runtime Web | Attention Heatmap XAI
        </div>

        <section className="absolute top-[214px] left-[8.0556%] w-[604px] stacked:static stacked:w-full tablet:min-w-0 tablet:mt-0 narrow:mt-[54px]" aria-labelledby="landing-title">
          <h1 className="m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[64px] font-extrabold tracking-[-2.6px] leading-[1.28] text-(--text-primary) stacked:leading-[1.15] tablet:text-[clamp(46px,5.3vw,64px)] tablet:tracking-[-2px] narrow:text-[clamp(42px,11vw,64px)] narrow:tracking-[-1.8px]" id="landing-title">
            <span className="block">AI-Assisted</span>
            <span className="block text-brand">Chest X-Ray</span>
            <span className="block">Learning Platform</span>
          </h1>
          <p className="mt-[22px] w-[390px] text-[16px] font-semibold leading-[1.35] text-[#c3d0e2] stacked:mt-[26px] stacked:leading-[1.25] tablet:w-[min(100%,340px)] narrow:w-[min(100%,390px)]">
            ThoraxScan is an educational LMS for Radiologic Technology students. Practice chest X-ray interpretation through professor-guided activities, with AI-powered Attention Heatmap feedback after submission.
          </p>
          <Link className={`${primaryButtonBase} mt-[42px] ml-2 h-[53px] w-[206px] gap-[7px] rounded-[12px] border border-[rgb(168_211_255/48%)] [background:var(--landing-login-bg)] shadow-(--landing-login-shadow) text-[25.2px] leading-none hover:[background:var(--landing-login-bg-hover)] focus-visible:outline-3 focus-visible:outline-[#c5e3ff] focus-visible:outline-offset-[5px] stacked:mt-[34px] stacked:ml-0 stacked:w-[min(206px,100%)] stacked:text-[22.4px]`} href="/login">
            Log in <span aria-hidden="true">→</span>
          </Link>
        </section>

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
              <li className={`absolute flex h-[81px] w-[146px] flex-col items-center justify-center gap-1 rounded-[16px] border p-2.5 [background:linear-gradient(135deg,rgb(43_65_105/78%),rgb(10_24_49/72%))] text-center text-[12px] font-semibold leading-[1.15] text-[#f2f6ff] backdrop-blur-[12px] shadow-(--landing-callout-shadow) ${calloutStyles[callout.color].position} ${calloutStyles[callout.color].border} stacked:static stacked:h-auto stacked:min-h-[58px] stacked:w-full stacked:flex-row stacked:justify-start stacked:px-4 stacked:py-[13px] stacked:text-left no-backdrop:[background:#14243e]`} key={callout.label}>
                <span className="[font-family:var(--font-inter),Arial,sans-serif] text-[14px] font-extrabold stacked:w-6 stacked:flex-[0_0_24px] stacked:text-center">{index + 1}</span>
                <span>{callout.label}</span>
              </li>
            ))}
          </ol>
        </figure>
      </main>

      <footer className="absolute inset-x-0 bottom-0 z-[2] flex min-h-[54px] items-start border border-[rgb(244_195_1/38%)] bg-[rgb(38_33_18/78%)] px-[31px] pt-1.5 pb-[5px] text-[16px] font-semibold leading-[1.15] text-[#ffe082] backdrop-blur-[20px] backdrop-saturate-[140%] shadow-[inset_0_1px_0_rgb(244_195_1/8%)] stacked:static stacked:min-h-0 stacked:px-[18px] stacked:py-2.5 stacked:text-[13px] stacked:leading-[1.2] no-backdrop:[background:#262112]">
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
        <span className="ml-auto flex items-center gap-3 whitespace-nowrap text-[12px] font-semibold text-[#d6e1f0] underline underline-offset-2">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
        </span>
      </footer>
    </div>
  );
}

