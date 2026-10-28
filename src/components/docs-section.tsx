import type { ReactNode } from "react";

import { glassCard, sectionLead, sectionShell, sectionTitle } from "@/components/landing-ui";

// The landing page's docs, after parada-landing's Docs page: a user guide, then developer docs. Each topic restates
// the repository files in its Source line; update them together. Links stay 404 for visitors while the repo is private.
const repoFile = (path: string) => `https://github.com/Addag/ThoraxScan/blob/main/${path}`;

type Topic = { id: string; title: string; gist: string; body: ReactNode; sources: string[] };

const p = "m-0 text-[0.9375rem] leading-[1.6] text-[#c3d0e2]";
const steps = "m-0 list-decimal space-y-2 pl-5 text-[0.9375rem] leading-[1.6] text-[#c3d0e2] marker:font-bold marker:text-brand";
const bullets = "m-0 list-disc space-y-2 pl-5 text-[0.9375rem] leading-[1.6] text-[#c3d0e2] marker:text-brand";
const code = "rounded-[6px] bg-(--glass-inset) px-1.5 py-0.5 font-mono text-[0.8125rem] text-[#e7f1ff]";
const pre = "m-0 overflow-x-auto rounded-[12px] border border-[rgb(175_207_255/20%)] bg-(--glass-inset) p-4 font-mono text-[0.8125rem] leading-[1.6] text-[#e7f1ff]";
const table = "w-full border-collapse text-left text-[0.875rem] leading-[1.5] text-[#c3d0e2] [&_td]:border-t [&_td]:border-[rgb(175_207_255/16%)] [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_td:first-child]:whitespace-nowrap [&_td:first-child]:font-mono [&_td:first-child]:text-[0.8125rem] [&_td:first-child]:text-[#e7f1ff]";

const userTopics: Topic[] = [
  {
    id: "doc-account",
    title: "Create an account",
    gist: "Register as a Student or a Professor.",
    body: (
      <ol className={steps}>
        <li>Open <b>Create an account</b> and choose Student or Professor.</li>
        <li>Enter your name, email and a password of at least 8 characters with at least one letter and one number. Agree to the Terms, acknowledge the Privacy Policy, and complete the security check.</li>
        <li>Confirm your email from the link ThoraxScan sends you.</li>
        <li>Professors: your account starts as a pending application. An administrator approves or rejects it; until then you see its status instead of the Professor dashboard.</li>
      </ol>
    ),
    sources: ["map/processes/registration.md", "map/processes/professor-application-review.md"],
  },
  {
    id: "doc-join",
    title: "Join a class",
    gist: "Students join a workspace with an invitation code.",
    body: (
      <>
        <p className={p}>Your professor gives you a 22-character invitation code. Enter it on your dashboard to join their workspace. Codes can expire and have a use limit; joining twice doesn&rsquo;t use the code again.</p>
        <p className={`${p} mt-3`}>Professors can remove students from a workspace. Co-professors can leave on their own; the owner can&rsquo;t.</p>
      </>
    ),
    sources: ["map/processes/invitation-redemption.md", "map/processes/membership-exit.md"],
  },
  {
    id: "doc-activity",
    title: "Complete an activity",
    gist: "Interpret the case, save drafts, then submit once.",
    body: (
      <ol className={steps}>
        <li>Open a published activity from your workspace. You see the instructions, the due date and the X-ray.</li>
        <li>Record your findings, whether the image is normal or abnormal, and for abnormal cases the relevant region.</li>
        <li>Save a draft as often as you like. Drafts are private.</li>
        <li>Submit when you&rsquo;re sure. You confirm first, and the final answer can&rsquo;t be changed. A draft left past the due date stays unsubmitted.</li>
      </ol>
    ),
    sources: ["map/processes/student-submission.md", "map/objects/learning/student-submission.md"],
  },
  {
    id: "doc-feedback",
    title: "Read your feedback",
    gist: "AI feedback after you submit, then your professor's evaluation.",
    body: (
      <ul className={bullets}>
        <li><b>AI feedback</b> appears only after your final submission. It lists likely findings, possible findings (often false alarms), every label the model scores, and the attention heatmap.</li>
        <li>The heatmap shows where the model&rsquo;s attention was concentrated. It doesn&rsquo;t mark a lesion or confirm a diagnosis.</li>
        <li><b>Faculty evaluation</b> shows your score and feedback once your professor releases it. Until then the activity shows as awaiting review.</li>
      </ul>
    ),
    sources: ["map/processes/student-activity-view.md", "map/objects/learning/ai-feedback-release.md", "map/processes/faculty-evaluation.md"],
  },
  {
    id: "doc-learning",
    title: "Practice in Learning Mode",
    gist: "Run the model on any X-ray without saving anything.",
    body: (
      <ol className={steps}>
        <li>Open <b>Learning mode</b> from the sidebar (Students and Professors).</li>
        <li>Pick an image from the built-in CheXpert library, or choose your own JPEG or PNG.</li>
        <li>Select <b>Analyze</b>. The model runs in your browser and shows findings, every label, and the attention heatmap.</li>
        <li>Nothing is saved: no submission, no upload, no stored result. <b>Reset</b> clears it.</li>
      </ol>
    ),
    sources: ["map/processes/student-learning-mode-inference.md", "map/objects/ui/student-learning-mode-surface.md"],
  },
  {
    id: "doc-class",
    title: "Set up a class",
    gist: "Professors: create a workspace and invite people.",
    body: (
      <ol className={steps}>
        <li>Once approved, create a workspace from your dashboard. You own it, and ownership can&rsquo;t be transferred.</li>
        <li>Generate invitation codes for students or co-professors. The code is shown once, so copy it then; only a hash is stored.</li>
        <li>Open the workspace to see the roster and remove members you&rsquo;re allowed to.</li>
      </ol>
    ),
    sources: ["map/processes/workspace-creation.md", "map/objects/learning/invitation-code.md", "map/processes/roster-management.md"],
  },
  {
    id: "doc-publish",
    title: "Publish an activity",
    gist: "Professors: draft, attach an X-ray, publish.",
    body: (
      <ol className={steps}>
        <li>Create a draft with a title, instructions and an optional due date.</li>
        <li>Attach one frontal chest X-ray: upload a JPEG or PNG, or pick one from the built-in library. Images that look like lateral views are rejected.</li>
        <li>Write the reference evaluation. Students never see it.</li>
        <li>Publish. A published activity&rsquo;s case can&rsquo;t be replaced; archiving is final.</li>
      </ol>
    ),
    sources: ["map/processes/activity-authoring-publication.md", "map/objects/learning/view-detector.md"],
  },
  {
    id: "doc-review",
    title: "Review, evaluate and track",
    gist: "Professors: grade submissions and follow the class.",
    body: (
      <ul className={bullets}>
        <li>The review queue lists final submissions, including those in archived activities.</li>
        <li>Save a private draft evaluation, then release it with a score and feedback. Released evaluations can&rsquo;t be changed, and students never see your remarks.</li>
        <li><b>Analytics</b> shows each workspace&rsquo;s on-time, late and missing work, released-score averages, the review backlog, and how often students agree with the AI&rsquo;s normal/abnormal call. Export the per-student table as CSV.</li>
      </ul>
    ),
    sources: ["map/processes/faculty-evaluation.md", "map/objects/learning/analytics.md"],
  },
  {
    id: "doc-settings",
    title: "Settings and accessibility",
    gist: "Profile, sign-in email, password, text size and contrast.",
    body: (
      <ul className={bullets}>
        <li><b>Profile:</b> display name, plus an optional work phone for Professors.</li>
        <li><b>Security:</b> change your sign-in email (confirmed from both addresses) or your password.</li>
        <li><b>Accessibility:</b> larger text and high contrast, saved in this browser. The theme button switches light and dark.</li>
      </ul>
    ),
    sources: ["map/objects/ui/shared-settings-surface.md", "map/processes/account-settings-update.md"],
  },
];

const devTopics: Topic[] = [
  {
    id: "doc-layout",
    title: "Repository layout",
    gist: "Where the code, database and model tooling live.",
    body: (
      <table className={table}>
        <tbody>
          <tr><td>src/app</td><td>Next.js routes: landing and legal pages, auth, and the protected Student, Professor and admin areas</td></tr>
          <tr><td>src/components</td><td>UI components shared across routes</td></tr>
          <tr><td>src/lib</td><td>Server data access, validation, analytics, and the in-browser inference runtime</td></tr>
          <tr><td>supabase</td><td>SQL migrations, pgTAP database tests and email templates</td></tr>
          <tr><td>scripts</td><td>Model-release CLI, ONNX Runtime asset prep, CheXpert library import, guide rendering</td></tr>
          <tr><td>model-export</td><td>ONNX export with the attention output, and view-detector training</td></tr>
          <tr><td>public</td><td>Images, the built-in X-ray library, guides and ONNX Runtime assets</td></tr>
          <tr><td>docs · map</td><td>Operator docs, and the source-backed system map</td></tr>
        </tbody>
      </table>
    ),
    sources: ["README.md", "map/CLAUDE.md"],
  },
  {
    id: "doc-flow",
    title: "How data flows",
    gist: "Two paths: learning records on the server, inference in the browser.",
    body: (
      <ul className={bullets}>
        <li><b>Learning records:</b> browser → Next.js Server Components and Server Actions → Supabase Auth (cookie sessions), Postgres (row-level security, RPCs, triggers) and Storage (private cases behind short-lived signed URLs).</li>
        <li><b>Inference:</b> the browser asks for the active release, downloads and verifies the model, preprocesses the image and runs ONNX Runtime Web (WebGPU, falling back to WebAssembly).</li>
        <li>Activity results (14 probabilities, the attention map and provenance) are saved once through an authorized RPC; Learning Mode results stay in memory.</li>
      </ul>
    ),
    sources: ["map/objects/inference/browser-inference-runtime.md", "map/processes/activity-ai-analysis.md", "map/CAPSTONE_CURRENT_STATE.md"],
  },
  {
    id: "doc-setup",
    title: "Getting started",
    gist: "Install, configure environment variables, start Supabase.",
    body: (
      <>
        <pre className={pre}>{"npm install\nnpx supabase start"}</pre>
        <p className={`${p} mt-3`}>Copy <code className={code}>.env.example</code> to <code className={code}>.env.local</code> and set <code className={code}>NEXT_PUBLIC_SUPABASE_URL</code>, <code className={code}>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, <code className={code}>NEXT_PUBLIC_SITE_URL</code> and <code className={code}>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>. Locally, use Cloudflare&rsquo;s always-pass Turnstile test keys, with the matching secret as <code className={code}>SUPABASE_AUTH_CAPTCHA_SECRET</code> in the root <code className={code}>.env</code>. Never use test keys in production.</p>
      </>
    ),
    sources: ["README.md", ".env.example", "supabase/README.md"],
  },
  {
    id: "doc-run",
    title: "Running and testing",
    gist: "Dev server, unit, browser-model and database tests.",
    body: (
      <>
        <pre className={pre}>{"npm run dev                 # prepares ONNX Runtime assets, then next dev\nnpm test                    # Vitest unit tests\nnpm run test:model:browser  # Vitest in Playwright Chromium\nnpm run lint\nnpm run build"}</pre>
        <p className={`${p} mt-3`}>Database behavior is covered by pgTAP tests in <code className={code}>supabase/tests/database</code>.</p>
      </>
    ),
    sources: ["README.md", "package.json"],
  },
  {
    id: "doc-models",
    title: "Model releases",
    gist: "Validate, stage, activate and roll back without redeploying.",
    body: (
      <>
        <p className={p}>Releases are immutable and content-addressed. A bundle under the ignored <code className={code}>model-input/&lt;release-id&gt;/</code> holds <code className={code}>model.onnx</code>, <code className={code}>release.json</code>, <code className={code}>thresholds.json</code>, an optional <code className={code}>possible-thresholds.json</code>, a preprocessing reference and test fixtures.</p>
        <pre className={`${pre} mt-3`}>{"npm run model:validate   # checksums, shapes, determinism, WASM and WebGPU parity\nnpm run model:stage      # upload as an inactive release\nnpm run model:status\nnpm run model:activate   # compare-and-swap the active pointer\nnpm run model:rollback"}</pre>
        <ul className={`${bullets} mt-3`}>
          <li>Contract v1: input <code className={code}>[batch, 1, 224, 224]</code>, Rec. 601 grayscale, bilinear resize, <code className={code}>(pixel / 255 − 0.5) / 0.25</code>; output 14 logits in a fixed label order.</li>
          <li>Contract v2 adds a <code className={code}>[batch, 1, 7, 7]</code> attention map.</li>
          <li>Weights and thresholds can change without a deploy while the contract stays the same.</li>
          <li>Validate locally first. Publisher service-role keys belong only in the operator environment, never in Vercel.</li>
        </ul>
      </>
    ),
    sources: ["docs/model-releases.md", "map/processes/model-validation.md", "map/processes/model-activation.md"],
  },
  {
    id: "doc-admins",
    title: "Administrators",
    gist: "Bootstrap the first one, then manage the rest in the app.",
    body: (
      <ul className={bullets}>
        <li>Administrator is a separate capability, not a registration role.</li>
        <li>An operator adds the first administrator once, directly in the database, after that person has registered and confirmed their email.</li>
        <li>From then on, administrators add or remove others in the Administrators section of <code className={code}>/admin</code>. Nobody can remove themselves, so one always remains.</li>
        <li>Administrators sign in by choosing <b>Administrator</b> on the normal login page.</li>
      </ul>
    ),
    sources: ["README.md", "map/objects/identity/platform-administrator.md"],
  },
  {
    id: "doc-deploy",
    title: "Deployment",
    gist: "Vercel Production on the hosted Supabase project.",
    body: (
      <ul className={bullets}>
        <li>Vercel Production points only at the hosted Supabase project, using its public URL and publishable key. There is no separate preview or staging database.</li>
        <li>Deploy the CAPTCHA-aware app before turning on CAPTCHA in hosted Supabase. To roll back, turn CAPTCHA off first.</li>
        <li>Before a production migration: run a linked dry run, review the Supabase Security and Performance Advisors, and take a backup.</li>
      </ul>
    ),
    sources: ["README.md", "supabase/README.md"],
  },
];

function DocTopic({ topic }: { topic: Topic }) {
  return (
    // data-reveal sits on the wrapper so the card's own styles can't override the reveal transition.
    <div data-reveal>
      <details className={`${glassCard} group`} id={topic.id}>
        <summary className="flex cursor-pointer list-none items-start gap-3 rounded-[22px] px-6 py-5 [&::-webkit-details-marker]:hidden">
          <svg className="mt-1 size-4 shrink-0 text-brand transition-transform duration-200 group-open:rotate-90" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 3 5 5-5 5" />
          </svg>
          <span className="grid gap-1">
            <span className="text-[1.0625rem] font-extrabold text-(--text-primary)">{topic.title}</span>
            <span className="text-[0.875rem] leading-[1.45] text-(--text-muted)">{topic.gist}</span>
          </span>
        </summary>
        <div className="grid gap-4 px-6 pb-6 pl-[52px] max-[640px]:pl-6">
          {topic.body}
          <p className="m-0 text-[0.75rem] leading-[1.5] text-(--text-muted)">
            Source:{" "}
            {topic.sources.map((file, index) => (
              <span key={file}>
                {index > 0 && ", "}
                <a className="font-mono text-[#9fcfff] underline underline-offset-2 [overflow-wrap:anywhere]" href={repoFile(file)} target="_blank" rel="noopener noreferrer">{file}</a>
              </span>
            ))}
          </p>
        </div>
      </details>
    </div>
  );
}

export function DocsSection() {
  return (
    <section id="docs" className={`${sectionShell} border-t border-[rgb(255_255_255/8%)]`} aria-labelledby="docs-title">
      <h2 className={sectionTitle} id="docs-title" data-reveal>Documentation</h2>
      <p className={sectionLead} data-reveal>How to use ThoraxScan as a student or professor, and how to set it up, run it and ship models as a developer. Each topic names the repository files it&rsquo;s drawn from.</p>
      <div className="mt-10 grid grid-cols-2 items-start gap-[clamp(24px,4vw,48px)] narrow:grid-cols-1">
        {([["Using ThoraxScan", userTopics], ["For developers", devTopics]] as const).map(([group, topics]) => (
          <div className="grid gap-3" key={group}>
            <h3 className="m-0 mb-2 [font-family:var(--font-inter),Arial,sans-serif] text-[clamp(1.375rem,2.2vw,1.75rem)] font-extrabold tracking-[-0.6px] text-(--text-primary)" data-reveal>{group}</h3>
            {topics.map((topic) => <DocTopic topic={topic} key={topic.id} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
