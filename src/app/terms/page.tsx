import type { Metadata } from "next";
import Link from "next/link";

import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_CONTROLLER_NAME,
  TERMS_EFFECTIVE_DATE,
  TERMS_VERSION,
} from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Terms and Conditions | ThoraxScan",
  description: "Terms for educational access, accounts, content, and responsible use of ThoraxScan.",
};

const sectionClass = "grid gap-2.5";
const linkClass = "font-semibold text-[#8ecbff] underline underline-offset-2";

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-(--app-background) px-5 py-10 text-foreground max-[600px]:px-4">
      <article className="mx-auto grid w-[min(900px,100%)] gap-8 rounded-[16px] border border-[#33425c] bg-(--surface-field) p-[clamp(24px,5vw,58px)] shadow-(--glass-shadow)">
        <header className="grid gap-3 border-b border-[#33425c] pb-6">
          <Link className={linkClass} href="/">← Back to ThoraxScan</Link>
          <p className="m-0 text-[12px] font-extrabold tracking-[0.08em] text-[#8ecbff] uppercase">Terms of use</p>
          <h1 className="m-0 text-[clamp(30px,5vw,48px)] font-extrabold leading-[1.1]">ThoraxScan Terms and Conditions</h1>
          <p className="m-0 text-[14px] leading-[1.6] text-(--text-secondary)">Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE_DATE}</p>
          <p className="m-0 border border-[#b98a26] bg-[rgba(185,138,38,0.16)] px-3.5 py-3 text-[13px] leading-[1.5] text-[#ffe3a1]">These terms contain operator, contact, and governing-law placeholders. Replace them and obtain the required legal and institutional review before public launch.</p>
        </header>

        <section className={sectionClass}><h2>1. Acceptance and operator</h2><p>These Terms and Conditions govern educational access to ThoraxScan, currently operated by {PRIVACY_CONTROLLER_NAME}. By agreeing to these terms when creating an account, you agree to follow them when using the service.</p><p>Contact: {PRIVACY_CONTACT_EMAIL}.</p></section>
        <section className={sectionClass}><h2>2. Educational, non-clinical purpose</h2><p>ThoraxScan is a training and learning tool for Radiologic Technology education. All AI outputs are for guided learning only. They are not diagnoses, medical advice, treatment recommendations, or a substitute for a qualified clinician.</p><p>Do not use ThoraxScan for clinical diagnosis, patient care, or decisions about a person’s health. It is not a patient-record repository.</p></section>
        <section className={sectionClass}><h2>3. Eligibility and accounts</h2><p>Choose the correct age group at registration: 18 or older, or under 18. Educational use by minors must follow the institution’s approved safeguards and may be restricted until the required guardian process is available. Under-18 research participation requires the separate approved guardian process and documented guardian consent.</p><p>Provide accurate account information, keep it current, protect your credentials, and do not share your account or impersonate another person. Report suspected unauthorized access using the contact above.</p><p>Professor accounts require administrator approval before access to Professor workspaces. Requesting the Professor role does not guarantee approval.</p></section>
        <section className={sectionClass}><h2>4. Acceptable use</h2><p>Use only approved, de-identified JPEG or PNG teaching or practice images that you are authorized to use. Do not upload or otherwise provide identifiable patient data, including identifiers in image pixels, file names, or metadata.</p><ul className="grid gap-2 pl-5"><li>Do not harass others, upload unlawful or harmful content, infringe rights, or interfere with the service.</li><li>Do not scrape the service, collect other users’ information without authorization, or abuse automated access.</li><li>Do not bypass authentication, workspace permissions, Cloudflare Turnstile, or other security controls.</li><li>Do not extract, copy, or reconstruct the platform’s models or model assets without the operator’s authorization.</li></ul></section>
        <section className={sectionClass}><h2>5. Professor and Student responsibilities</h2><p>Professors are responsible for the content they provide in their workspaces, permission to use teaching images, appropriate educational activities, and their evaluations and feedback. Professors must review AI outputs in the context of guided learning.</p><p>Students are responsible for their own submissions, following activity instructions and institutional academic-integrity requirements, and using feedback for educational purposes.</p></section>
        <section className={sectionClass}><h2>6. Separate voluntary research</h2><p>Agreement to these terms is separate from voluntary participation in ThoraxScan capstone research. Research participation requires a separate choice and any approvals required by the study protocol. You may decline or withdraw from voluntary research without treating that choice as withdrawal from educational platform access, subject to disclosed institutional access requirements.</p><p>Read the <Link className={linkClass} href="/privacy-policy">Privacy Policy</Link> for information about data processing, research choices, and the guardian-process limitations.</p></section>
        <section className={sectionClass}><h2>7. Content and intellectual property</h2><p>You retain your rights in the content you provide. You grant the operator a non-exclusive licence to host, store, process, reproduce, and display that content as needed to operate the service and provide the educational features you use, subject to the Privacy Policy and applicable permissions. This licence does not replace separate research consent.</p><p>The operator retains its rights in the ThoraxScan platform and models. Third-party materials remain subject to their owners’ rights and applicable licences. Educational access does not transfer ownership of the platform or models to you.</p></section>
        <section className={sectionClass}><h2>8. AI limitations and availability</h2><p>AI outputs may be incorrect, incomplete, or unsuitable for a particular image. No accuracy guarantee is provided. Review outputs critically with faculty guidance and do not rely on them for clinical decisions.</p><p>To the extent permitted by applicable law, the service is provided “as is” and “as available”, without warranties of accuracy, fitness for a particular purpose, or uninterrupted availability. Features, models, and access may change, be interrupted, or be suspended for maintenance, security, or operational reasons.</p></section>
        <section className={sectionClass}><h2>9. Suspension and termination</h2><p>The operator may restrict, suspend, or terminate access for violations of these terms, security or abuse concerns, institutional access decisions, or discontinuation of the service. Where appropriate and practicable, the operator will provide notice and a way to raise concerns using the contact below.</p><p>You may stop using the service and request account closure using the contact below. Suspension or closure does not promise immediate deletion of all records; retention and deletion are described in the Privacy Policy.</p></section>
        <section className={sectionClass}><h2>10. Limitation of liability</h2><p>To the extent permitted by applicable law, the operator is not liable for indirect, incidental, special, or consequential losses arising from use of, or inability to use, ThoraxScan, including reliance on AI outputs or interruptions to the service. Nothing in these terms excludes or limits liability or rights that cannot lawfully be excluded or limited.</p></section>
        <section className={sectionClass}><h2>11. Governing law — to be confirmed</h2><p>[Governing law and dispute-resolution arrangements must be confirmed before public launch.] The Philippines is the proposed jurisdiction, subject to confirmation of the operator and institutional arrangements and any mandatory laws or rights that apply to users in other locations.</p></section>
        <section className={sectionClass}><h2>12. Changes and contact</h2><p>The operator will update the version and effective date when these terms change. Material changes will be communicated before they apply, with renewed agreement where required by applicable law or institutional policy.</p><p>For questions about these terms or account access, contact {PRIVACY_CONTACT_EMAIL}.</p></section>
        <footer className="border-t border-[#33425c] pt-5 text-[13px] leading-[1.6] text-(--text-secondary)"><Link className={linkClass} href="/login">Log in</Link> · <Link className={linkClass} href="/register">Create an account</Link> · <Link className={linkClass} href="/privacy-policy">Privacy Policy</Link></footer>
      </article>
    </main>
  );
}
