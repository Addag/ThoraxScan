import Image from "next/image";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { AuthForm, AuthMode } from "@/components/auth/auth-form";
import { authEyebrowClass } from "@/components/field-error";

const authCopy = {
  login: {
    title: "Welcome Back!",
    eyebrow: "Login credentials",
    subtitle: "Continue your educational journey",
  },
  register: {
    title: "Create Account",
    eyebrow: "Register credentials",
    subtitle: "Start your educational journey",
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

// Font sizes here and in auth-form.tsx stay px: the auth pages keep a fixed marketing scale whatever the Accessibility text size.
// Both columns are normal flow: each centres its content when there is room and scrolls when there is not.
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
  const cardClass = `my-auto w-[min(551px,100%)] border border-[rgb(177_208_255/32%)] rounded-[22px] [background:var(--glass-surface)] backdrop-blur-[24px] backdrop-saturate-[140%] shadow-(--glass-shadow) px-[38px] py-8 narrow:px-6 max-[420px]:px-[18px] not-supports-[backdrop-filter:blur(6px)]:bg-[rgba(8,18,61,0.94)]`;
  const statusClass = messageStatus === "error" ? "border-[#8b2929] bg-[rgba(160,32,32,0.2)] text-[#ffb4b4]" : "border-[#17643a] bg-[rgba(33,135,78,0.2)] text-[#b8f3ce]";

  return (
    <main data-theme="dark" className="grid min-h-svh grid-cols-2 overflow-x-hidden [background:radial-gradient(ellipse_at_72%_28%,rgb(48_112_255/32%),transparent_42%),radial-gradient(ellipse_at_96%_70%,rgb(143_77_213/25%),transparent_38%),radial-gradient(ellipse_at_16%_55%,rgb(0_135_220/22%),transparent_46%),#030b1d] narrow:block">
      <section className="flex flex-col gap-6 px-[clamp(24px,5vw,72px)] py-6 [background:linear-gradient(145deg,rgb(24_58_113/18%),rgb(3_8_39/32%))] narrow:pb-10 max-[420px]:px-[18px]" aria-label="ThoraxScan introduction">
        <Link className="transition-colors duration-160 hover:text-white self-start text-[13px] font-extrabold leading-4 text-[#aeb6c5] no-underline" href="/">← Back to home</Link>
        <Brand variant="auth" />

        <div className="my-auto grid w-full max-w-[610px] gap-7 self-center narrow:my-0 narrow:self-start narrow:gap-6">
          <h1 className="m-0 font-brand text-[clamp(36px,4vw,48px)] font-extrabold tracking-[-1.5px] leading-[1.2] narrow:text-[clamp(36px,10vw,48px)] narrow:leading-[1.12]">
            AI-Assisted <span className="whitespace-nowrap text-brand">Chest X-Ray</span> Learning Platform
          </h1>
          <p className="m-0 max-w-[390px] text-[16px] font-semibold leading-[1.25] text-[#d6e1f0]">
            ThoraxScan is an educational LMS for Radiologic Technology students. Practice chest X-ray interpretation through professor-guided activities, with AI-powered finding heatmaps after submission.
          </p>
          <div className="w-full max-w-[507px] narrow:hidden" aria-hidden="true">
            <Image
              className="block aspect-[507/338] w-full rounded-t-panel border border-(--border-default) object-cover"
              src="/images/xray-sample.png"
              alt=""
              width={507}
              height={338}
              preload
            />
            <div className="h-10 rounded-b-panel border border-t-0 border-(--border-default) bg-[#0a1223]" />
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center px-6 py-6 narrow:px-[18px] narrow:pt-0 narrow:pb-12" aria-labelledby={`${mode}-title`}>
        <div className={cardClass}>
          <h2 className="m-0 text-[32px] font-extrabold leading-[1.25]" id={`${mode}-title`}>{copy.title}</h2>
          <p className="mt-px mb-6 text-[13px] leading-[1.5] text-[#d6e1f0]">{copy.subtitle}</p>
          <p className={authEyebrowClass}>{copy.eyebrow}</p>
          {message && (
            <p
              className={`mt-4 mb-4 rounded-control border px-3 py-2.5 text-[13px] leading-[1.4] ${statusClass}`}
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
