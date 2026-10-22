import type { Metadata } from "next";
import Link from "next/link";

import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_CONTROLLER_ADDRESS,
  PRIVACY_CONTROLLER_NAME,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
} from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | ThoraxScan",
  description: "How ThoraxScan handles account, educational, research, and technical information.",
};

const sectionClass = "grid gap-2.5";
const linkClass = "font-semibold text-[#8ecbff] light:text-(--brand-blue-text) underline underline-offset-2";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-svh bg-(--app-background) px-5 py-10 text-foreground max-[600px]:px-4">
      <article className="mx-auto grid w-[min(900px,100%)] gap-8 rounded-[16px] border border-(--border-shell) bg-(--surface-field) p-[clamp(24px,5vw,58px)] shadow-(--glass-shadow)">
        <header className="grid gap-3 border-b border-(--border-shell) pb-6">
          <Link className={linkClass} href="/">← Back to ThoraxScan</Link>
          <p className="m-0 text-[12px] font-extrabold tracking-[0.08em] text-[#8ecbff] light:text-(--brand-blue-text) uppercase">Privacy and data</p>
          <h1 className="m-0 text-[clamp(30px,5vw,48px)] font-extrabold leading-[1.1]">ThoraxScan Privacy Policy</h1>
          <p className="m-0 text-[14px] leading-[1.6] text-(--text-secondary)">Version {PRIVACY_POLICY_VERSION} · Effective {PRIVACY_POLICY_EFFECTIVE_DATE}</p>
          <p className="m-0 border border-[#b98a26] bg-[rgba(185,138,38,0.16)] px-3.5 py-3 text-[13px] leading-[1.5] text-[#ffe3a1] light:text-(--status-warning-text)">This policy contains operator and institutional placeholders. Replace them and obtain the required research and privacy approvals before public launch.</p>
        </header>

        <section className={sectionClass}><h2>1. Who operates ThoraxScan</h2><p>ThoraxScan is currently operated by {PRIVACY_CONTROLLER_NAME}.</p><dl className="grid gap-1 text-[14px] leading-[1.6]"><div><dt className="inline font-semibold">Address: </dt><dd className="inline">{PRIVACY_CONTROLLER_ADDRESS}</dd></div><div><dt className="inline font-semibold">Privacy requests: </dt><dd className="inline">{PRIVACY_CONTACT_EMAIL}</dd></div></dl></section>
        <section className={sectionClass}><h2>2. Scope and purpose</h2><p>ThoraxScan is an educational learning platform developed as a capstone project and tested with BSRT students. It is intended for international users and is not a clinical service.</p></section>
        <section className={sectionClass}><h2>3. Information we process</h2><ul className="grid gap-2 pl-5"><li><strong>Account information:</strong> email address, display name, selected role, authentication events, and optional work phone.</li><li><strong>Learning information:</strong> workspaces, invitations, activities, drafts, submissions, faculty evaluations, timestamps, and account settings.</li><li><strong>Teaching cases:</strong> approved, de-identified JPEG or PNG chest X-rays uploaded by authorized professors, together with file metadata and access records. Do not upload identifiable patient images.</li><li><strong>AI information:</strong> model release identifiers, probabilities, thresholds, findings, attention-map results where available, execution provider, and application-build information.</li><li><strong>Local practice images:</strong> images selected in Learning Mode are processed in the browser and remain in browser memory for that practice session. Professor activity uploads use the separate private teaching-case flow.</li><li><strong>Security and performance information:</strong> authentication cookies, request and service logs, abuse-prevention signals, analytics events, device and browser information, routes, and performance measurements.</li></ul></section>
        <section className={sectionClass}><h2>4. Why we process information</h2><ul className="grid gap-2 pl-5"><li>To create and secure accounts and provide the platform.</li><li>To deliver professor-guided educational activities, submissions, evaluations, and feedback.</li><li>To prevent abuse and verify registration requests. When enabled, Cloudflare Turnstile processes signals such as IP address, TLS fingerprint, user-agent header, site key, and origin for bot detection and service improvement. See the <a className={linkClass} href="https://www.cloudflare.com/turnstile-privacy-policy/">Turnstile Privacy Addendum</a>.</li><li>To evaluate ThoraxScan for the capstone study, only with consent collected separately from registration.</li><li>To understand usage and improve reliability. Vercel Web Analytics is documented as aggregated and not using third-party cookies; Speed Insights reports anonymous performance information such as route, device, browser, country, and Web Vitals. See <a className={linkClass} href="https://vercel.com/docs/analytics/privacy-policy">Vercel Web Analytics privacy information</a> and <a className={linkClass} href="https://vercel.com/docs/speed-insights/privacy-policy">Vercel Speed Insights privacy information</a>.</li></ul></section>
        <section className={sectionClass}><h2>5. Service providers and disclosures</h2><p>Information may be processed by Supabase for authentication, database, and private storage; Vercel for hosting and optional analytics or performance measurement; Cloudflare for Turnstile; and authorized developers, professors, administrators, and institution representatives who need access for the purposes described here.</p><p>These providers may process information in countries other than your own. The applicable provider terms, contractual safeguards, and local law determine the details of an international transfer.</p></section>
        <section className={sectionClass}><h2>6. Retention</h2><p>Accounts and essential account records are retained until you request deletion, the institution closes the account, or another approved retention basis applies.</p><p>Teaching cases, activity records, submissions, faculty evaluations, and AI results are intended to be retained for one academic term, followed by deletion or approved archival under the research protocol and institutional procedure. The application must complete and verify that deletion or archival procedure before this statement is treated as an automatic guarantee.</p><p>Provider logs and backups may persist for the periods set by those providers. Deletion from the live application does not promise immediate removal from backups.</p></section>
        <section className={sectionClass}><h2>7. Security</h2><p>ThoraxScan uses authenticated access, workspace authorization, private teaching-case storage, short-lived signed access URLs, server-side authorization checks, and browser-side model inference where supported. No online system can guarantee absolute security.</p></section>
        <section className={sectionClass}><h2>8. Age and research participation</h2><p>ThoraxScan does not ask for your age. If you are under 18, use it only as your institution allows. Creating an account does not enroll you in research; any capstone research evaluation, such as a usability questionnaire, is run separately and asks for its own consent.</p></section>
        <section className={sectionClass}><h2>9. Your choices and rights</h2><p>Depending on your location and applicable law, you may request access, correction, deletion, restriction, objection, portability, or withdrawal of consent where consent is the processing basis.</p><p>Send a request to {PRIVACY_CONTACT_EMAIL}. If your request is not handled properly, you may contact the relevant privacy regulator, including the Philippine National Privacy Commission where Philippine law applies.</p></section>
        <section className={sectionClass}><h2>10. Medical and research limitations</h2><p>ThoraxScan outputs are for guided learning only. They are not diagnoses, medical advice, treatment recommendations, or a substitute for a qualified clinician. ThoraxScan is not a patient-record repository. The app does not authorize uploading identifiable patient data.</p></section>
        <section className={sectionClass}><h2>11. Changes</h2><p>We will update the version and effective date when this policy changes. Material changes should be presented before the affected processing begins or when required by applicable law.</p></section>
        <footer className="border-t border-(--border-shell) pt-5 text-[13px] leading-[1.6] text-(--text-secondary)"><Link className={linkClass} href="/login">Log in</Link> · <Link className={linkClass} href="/register">Create an account</Link> · <Link className={linkClass} href="/terms">Terms</Link></footer>
      </article>
    </main>
  );
}
