import Image from "next/image";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { AuthForm, AuthMode } from "@/components/auth/auth-form";
import { authEyebrowClass } from "@/components/field-error";

const authCopy = {
  login: {
    title: "Welcome Back!",
    eyebrow: "Login Credentials",
    subtitle: "Continue your Educational Journey",
  },
  register: {
    title: "Create Account",
    eyebrow: "Register Credentials",
    subtitle: "Start your Educational Journey",
  },
  forgot: {
    title: "Reset Password",
    eyebrow: "Account Recovery",
    subtitle: "Request a secure reset link",
  },
  reset: {
    title: "New Password",
    eyebrow: "Account Recovery",
    subtitle: "Choose a new password",
  },
} as const;

export function AuthLayout({
  mode,
  message,
  messageStatus = "success",
}: {
  mode: AuthMode;
  message?: string;
  messageStatus?: "success" | "error";
}) {
  const copy = authCopy[mode];
  const cardClass = `w-[min(551px,100%)] border border-[rgb(177_208_255/32%)] rounded-[22px] [background:var(--glass-surface)] backdrop-blur-[24px] backdrop-saturate-[140%] shadow-(--glass-shadow) px-[38px] pt-[31px] pb-10 narrow:px-6 narrow:pt-[30px] narrow:pb-9 max-[420px]:px-[18px] ${mode === "register" ? "w-[min(547px,100%)]" : ""} not-supports-[backdrop-filter:blur(6px)]:bg-[rgba(8,18,61,0.94)]`;
  const statusClass = messageStatus === "error" ? "border-[#8b2929] bg-[rgba(160,32,32,0.2)] text-[#ffb4b4]" : "border-[#17643a] bg-[rgba(33,135,78,0.2)] text-[#b8f3ce]";

  return (
    <main className="grid min-h-svh grid-cols-2 overflow-x-hidden [background:radial-gradient(ellipse_at_72%_28%,rgb(48_112_255/32%),transparent_42%),radial-gradient(ellipse_at_96%_70%,rgb(143_77_213/25%),transparent_38%),radial-gradient(ellipse_at_16%_55%,rgb(0_135_220/22%),transparent_46%),#030b1d] narrow:block">
      <section className="relative min-h-[1024px] overflow-hidden [background:linear-gradient(145deg,rgb(24_58_113/18%),rgb(3_8_39/32%))] narrow:min-h-0 narrow:px-6 narrow:pt-20 narrow:pb-[42px] max-[420px]:px-[18px]" aria-label="ThoraxScan introduction">
        <Link className="transition-colors duration-160 hover:text-white absolute top-5 left-[-20px] z-2 w-[215px] text-center text-[13px] font-extrabold leading-4 text-[#aeb6c5] no-underline narrow:top-[18px] narrow:left-[18px] narrow:w-auto" href="/">← Back to home</Link>
        <Brand variant="auth" />

        <div className="absolute top-[194px] left-1/2 w-[min(610px,85%)] [transform:translateX(-50%)] narrow:static narrow:w-full narrow:[transform:none]">
          <h1 className="m-0 font-(--font-inter) text-[48px] font-extrabold tracking-[-1.5px] leading-[1.2] max-[1200px]:text-[clamp(38px,4vw,48px)] narrow:text-[clamp(36px,10vw,48px)] narrow:leading-[1.12]">
            AI-Assisted <span className="text-brand">Chest X-Ray</span> Learning Platform
          </h1>
          <p className="w-[340px] mt-7 mb-0 ml-[-5px] text-[16px] font-semibold leading-[1.25] text-[#d6e1f0] narrow:w-[min(100%,390px)] narrow:mt-6 narrow:ml-0">
            ThoraxScan is an educational LMS for Radiologic Technology students. Practice chest X-ray interpretation through professor-guided activities, with AI-powered Attention Heatmap feedback after submission.
          </p>
        </div>

        <div className="absolute top-[558px] left-1/2 h-[378px] w-[507px] [transform:translateX(-50%)] max-[1200px]:[transform:translateX(-50%)_scale(0.82)] max-[1200px]:origin-top narrow:hidden" aria-hidden="true">
          <Image
            className="absolute top-0 left-0 block h-[338px] w-[507px] rounded-t-[10px] border border-(--border-default) object-cover"
            src="/images/xray-sample.png"
            alt=""
            width={507}
            height={338}
            priority
          />
          <div className="absolute top-[337px] left-px h-10 w-[505px] rounded-b-[10px] border border-(--border-default) bg-[#0a1223]" />
        </div>
      </section>

      <section className="flex items-start justify-center bg-transparent px-6 pt-[140px] pb-20 narrow:px-[18px] narrow:pt-0 narrow:pb-12" aria-labelledby={`${mode}-title`}>
        <div className={cardClass}>
          <h2 className="m-0 text-[32px] font-extrabold leading-[1.25]" id={`${mode}-title`}>{copy.title}</h2>
          <p className="mt-px mb-[31px] text-[13px] leading-[1.5] text-[#d6e1f0]">{copy.subtitle}</p>
          <p className={authEyebrowClass}>{copy.eyebrow}</p>
          {message && (
            <p
              className={`mt-4 mb-4 border px-3 py-2.5 text-[13px] leading-[1.4] ${statusClass}`}
              role={messageStatus === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}
          <AuthForm mode={mode} />
          <p className="mt-5 text-center text-[12px] leading-[1.5] text-[#b9c8dd]">
            <Link className="font-semibold text-[#9fd1ff] underline underline-offset-2" href="/privacy-policy">Privacy Policy</Link>
            {" · "}<Link className="font-semibold text-[#9fd1ff] underline underline-offset-2" href="/terms">Terms</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
