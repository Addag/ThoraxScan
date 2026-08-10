import Image from "next/image";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { AuthForm, AuthMode } from "@/components/auth/auth-form";

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
} as const;

export function AuthLayout({ mode }: { mode: AuthMode }) {
  const copy = authCopy[mode];

  return (
    <main className="auth-page">
      <section className="auth-visual-panel" aria-label="ThoraxScan introduction">
        <Link className="back-home" href="/">← Back to home</Link>
        <Brand className="auth-brand" />

        <div className="auth-visual-copy">
          <h1>
            AI-Assisted <span className="accent-text">Chest X-Ray</span> Learning Platform
          </h1>
          <p>
            ThoraxScan is an educational LMS for Radiologic Technology students. Practice chest X-ray interpretation through professor-guided activities, with AI-powered Attention Heatmap feedback after submission.
          </p>
        </div>

        <div className="auth-xray" aria-hidden="true">
          <Image
            className="auth-xray-image"
            src="/images/xray-sample.png"
            alt=""
            width={507}
            height={338}
            priority
          />
          <div className="auth-xray-base" />
        </div>
      </section>

      <section className="auth-form-panel" aria-labelledby={`${mode}-title`}>
        <div className={`auth-card auth-card--${mode}`}>
          <h2 id={`${mode}-title`}>{copy.title}</h2>
          <p className="auth-subtitle">{copy.subtitle}</p>
          <p className="auth-eyebrow">{copy.eyebrow}</p>
          <AuthForm mode={mode} />
        </div>
      </section>
    </main>
  );
}
