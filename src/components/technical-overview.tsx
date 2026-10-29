import { glassCard, sectionLead, sectionShell, sectionTitle } from "@/components/landing-ui";

// The landing page's technical overview, after parada-landing's technical tab. Every fact comes from the system map
// (map/objects, map/processes) or package.json; update both together. The headline model figures live in the page's
// "Under the hood" section, so this one carries only the details.
const toc = [
  ["architecture", "Architecture"],
  ["features", "Features"],
  ["model-details", "Model details"],
  ["stack", "Stack"],
  ["security", "Security"],
  ["status", "Status"],
  ["academic", "Academic project"],
] as const;

const architecture = [
  { name: "Browser", tech: "Next.js 16 · React 19 · Tailwind CSS 4" },
  { name: "Server", tech: "Server Components · Server Actions · Supabase SSR sessions" },
  { name: "Database", tech: "Supabase Postgres · row-level security · RPCs · triggers" },
  { name: "Storage", tech: "Private activity cases · content-addressed model artifacts" },
  { name: "In-browser AI", tech: "ONNX Runtime Web · WebGPU, WebAssembly fallback" },
] as const;

const highlights = [
  { title: "Inference runs in the browser", body: "The browser downloads the active model, verifies its bytes, preprocesses the X-ray and runs it with ONNX Runtime Web. The server stores results; it never runs the model." },
  { title: "The database enforces the rules", body: "Row-level security, lifecycle triggers and immutable rows live in Postgres, so the rules hold whichever page or request touches the data." },
  { title: "Models change without a redeploy", body: "A new model is validated, registered as an immutable release, then activated by moving one database pointer. Rollback moves it back, and past analyses keep the model that produced them." },
] as const;

const features = [
  { module: "Accounts and access", items: ["Student or Professor registration with email confirmation", "Cloudflare Turnstile on sign-up, login and password recovery", "Professor accounts approved by an administrator", "Settings: theme, text size, high contrast, sign-in email"] },
  { module: "Workspaces", items: ["Professor-owned class workspaces", "Expiring, use-limited invitation codes for students and co-professors", "Membership-scoped access to every activity and case"] },
  { module: "Activities", items: ["Draft → published → archived lifecycle", "One X-ray case per activity: JPEG or PNG upload, or a pick from the built-in library", "A private reference evaluation students never receive", "Optional due dates and a notification bell"] },
  { module: "Submissions and feedback", items: ["Drafts, then one immutable final answer: findings, normal or abnormal, and region", "AI feedback released only after submission", "Faculty evaluation with a score and feedback, released explicitly"] },
  { module: "Learning Mode", items: ["Practice on a 234-image CheXpert library or your own image", "Likely and possible findings across all 14 labels", "Finding heatmaps and a printable heatmap guide", "Practice results stay in browser memory"] },
  { module: "Administration", items: ["Review Professor applications", "Grant and revoke administrator access; the last administrator can't remove themselves"] },
] as const;

const modelDetails = [
  ["Release", "squeezevit-v6-nih-cam-possible85-20261030.1"],
  ["Model", "SqueezeViT, a compact vision transformer distilled from a FastViT-SA12 teacher."],
  ["Training data", "CheXpert v1.0 (frontal and lateral views) plus the NIH ChestX-ray14 training split (frontal). Labels NIH does not report are left out of the loss for its images. Checkpoint and thresholds are chosen on a held-out patient split, so the 234-image official validation set stays unseen."],
  ["Input", "Grayscale, resized to 224×224 and normalized, with the same transform in training and in the browser."],
  ["Thresholds", "Per-label F1 on the held-out split. Cardiomegaly is lowered to reach 80% held-out sensitivity. A \"possible\" tier flags the five competition labels at 85% sensitivity."],
  ["Explainability", "Class activation maps: the classifier's weights for each finding applied to the final 14×14 feature map, clipped at zero and scaled per finding. Exact for this architecture and computed in the same forward pass. A guide to where the evidence is, not a lesion outline."],
  ["Limits", "Learning Mode accepts frontal and lateral images; activities accept frontal only. Lateral held-out competition AUC is 0.81 (frontal 0.79), but lateral mean AUC is lower (0.74 vs 0.79). Cardiomegaly sensitivity is 0.50 on the official set even after tuning. Not clinically validated."],
] as const;

const stack = [
  { group: "Frontend", items: ["Next.js 16 (App Router)", "React 19", "Tailwind CSS 4", "TypeScript"] },
  { group: "Data and auth", items: ["Supabase Auth", "Postgres with row-level security", "Supabase Storage", "sharp for server-side image checks"] },
  { group: "AI", items: ["PyTorch training", "ONNX export", "ONNX Runtime Web 1.27", "WebGPU and WebAssembly"] },
  { group: "Operations", items: ["Cloudflare Turnstile", "Vercel Analytics and Speed Insights", "Vitest unit and Playwright browser tests"] },
] as const;

const security = [
  { title: "Row-level security", body: "Every table is guarded in Postgres. Students read only their own work; Professors read only final submissions in their workspaces." },
  { title: "Answers stay private", body: "Reference evaluations live in a separate table, and the student data layer never serializes them." },
  { title: "Private case images", body: "Images upload straight to a private bucket with a signed token. The server then re-checks type, size and that the file actually decodes." },
  { title: "Hashed invitations", body: "Codes are 128-bit, expiring and use-limited. Only SHA-256 hashes are stored, and redemption locks the row so caps hold under load." },
  { title: "Immutable records", body: "Final submissions, released AI feedback, released evaluations, model releases and published cases can't be edited or deleted." },
  { title: "Verified models", body: "Model files are content-addressed and checked before they run. If the active release changes mid-session, the runtime fails closed rather than using a stale model." },
  { title: "Hardened sign-in", body: "CAPTCHA on every auth form, email confirmation, passwords with at least 8 characters including a letter and a number, and safe-only redirects." },
  { title: "Separate admin capability", body: "Administrator access is its own record, not a role, re-checked on every admin page, with no self-service way to obtain it." },
] as const;

const status = {
  implemented: [
    "Accounts, roles, Professor approval and administrator management",
    "Workspaces, invitation codes and membership",
    "Activities with private cases and reference evaluations",
    "Draft and final submissions",
    "In-browser AI analysis with finding heatmaps, released after submission",
    "Faculty evaluation and notifications",
    "Class analytics with CSV export",
    "Learning Mode with the built-in X-ray library, frontal and lateral",
    "Model registry with validation, staging, activation and rollback",
    "Privacy notice consent recording and accessibility settings",
  ],
  continuing: [
    "Network testing to confirm what the browser inference path sends and keeps",
    "Lateral views for activities",
    "Legal and institutional review of the privacy policy and terms",
    "Separate research evaluation, such as a usability questionnaire, with its own consent",
  ],
} as const;

const tocLink = "rounded-full border border-[rgb(168_211_255/32%)] px-4 py-1.5 text-[0.875rem] font-semibold text-[#c3d0e2] no-underline hover:border-[rgb(168_211_255/80%)] hover:text-[#e7f1ff]";
const subTitle = "m-0 [font-family:var(--font-inter),Arial,sans-serif] text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold tracking-[-0.8px] leading-[1.2] text-(--text-primary)";
const subSection = "mt-[clamp(56px,7vw,88px)] scroll-mt-6";
const cardTitle = "m-0 text-[1.125rem] font-extrabold text-(--text-primary)";
const cardBody = "mt-2 mb-0 text-[0.9375rem] leading-[1.55] text-[#c3d0e2]";
const bulletList = "m-0 list-disc space-y-2 pl-5 text-[0.9375rem] leading-[1.55] text-[#c3d0e2] marker:text-brand";

export function TechnicalOverview() {
  return (
    <section id="technical" className={`${sectionShell} border-t border-[rgb(255_255_255/8%)]`} aria-labelledby="technical-title">
      <h2 className={sectionTitle} id="technical-title" data-reveal>How ThoraxScan is built</h2>
      <p className={sectionLead} data-reveal>The technical overview: architecture, modules, model details, stack, security, and where the build stands.</p>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Technical overview" data-reveal>
        {toc.map(([id, label]) => <a className={tocLink} href={`#${id}`} key={id}>{label}</a>)}
      </nav>

      <section id="architecture" className={subSection} aria-labelledby="architecture-title">
        <h3 className={subTitle} id="architecture-title" data-reveal>System architecture</h3>
        <p className={sectionLead} data-reveal>A browser-inference learning platform with a supporting backend: the server keeps the records and the rules, and the browser runs the model.</p>
        <ol className="mt-8 mb-0 grid list-none grid-cols-5 gap-3 p-0 stacked:grid-cols-1">
          {architecture.map((node, index) => (
            <li className={`${glassCard} flex flex-col gap-2 p-5 stacked:flex-row stacked:items-baseline stacked:gap-4`} key={node.name} data-reveal>
              <span className="[font-family:var(--font-inter),Arial,sans-serif] text-[0.875rem] font-extrabold text-brand" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <b className="text-[1.0625rem] text-(--text-primary)">{node.name}</b>
              <span className="text-[0.875rem] leading-[1.45] text-[#c3d0e2]">{node.tech}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 grid grid-cols-3 gap-5 stacked:grid-cols-1">
          {highlights.map((h) => (
            <div className={`${glassCard} p-6`} key={h.title} data-reveal>
              <h4 className={cardTitle}>{h.title}</h4>
              <p className={cardBody}>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className={subSection} aria-labelledby="features-title">
        <h3 className={subTitle} id="features-title" data-reveal>Features, grouped by module</h3>
        <div className="mt-8 grid grid-cols-3 gap-5 stacked:grid-cols-2 max-[640px]:grid-cols-1">
          {features.map((f) => (
            <div className={`${glassCard} p-6`} key={f.module} data-reveal>
              <h4 className={`${cardTitle} mb-4`}>{f.module}</h4>
              <ul className={bulletList}>{f.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section id="model-details" className={subSection} aria-labelledby="model-details-title">
        <h3 className={subTitle} id="model-details-title" data-reveal>Model details</h3>
        <dl className={`${glassCard} mt-8 mb-0 divide-y divide-[rgb(175_207_255/16%)] px-6`} data-reveal>
          {modelDetails.map(([term, detail]) => (
            <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-6 py-5 narrow:grid-cols-1 narrow:gap-1.5" key={term}>
              <dt className="text-[0.9375rem] font-extrabold text-(--text-primary)">{term}</dt>
              <dd className="m-0 text-[0.9375rem] leading-[1.55] break-words text-[#c3d0e2]">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="stack" className={subSection} aria-labelledby="stack-title">
        <h3 className={subTitle} id="stack-title" data-reveal>What it&rsquo;s built with</h3>
        <div className="mt-8 grid grid-cols-4 gap-5 stacked:grid-cols-2 max-[640px]:grid-cols-1">
          {stack.map((s) => (
            <div className={`${glassCard} p-6`} key={s.group} data-reveal>
              <h4 className={`${cardTitle} mb-4`}>{s.group}</h4>
              <ul className={bulletList}>{s.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className={subSection} aria-labelledby="security-title">
        <h3 className={subTitle} id="security-title" data-reveal>Designed with security in mind</h3>
        <div className="mt-8 grid grid-cols-4 gap-5 stacked:grid-cols-2 max-[640px]:grid-cols-1">
          {security.map((s) => (
            <div className={`${glassCard} p-6`} key={s.title} data-reveal>
              <h4 className={cardTitle}>{s.title}</h4>
              <p className={cardBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="status" className={subSection} aria-labelledby="status-title">
        <h3 className={subTitle} id="status-title" data-reveal>Where the build stands</h3>
        <div className="mt-8 grid grid-cols-2 gap-5 narrow:grid-cols-1">
          <div className={`${glassCard} p-6`} data-reveal>
            <h4 className={`${cardTitle} mb-4 text-[#a9f0d4]`}>Implemented</h4>
            <ul className={`${bulletList} marker:text-[#67deb3]`}>{status.implemented.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className={`${glassCard} p-6`} data-reveal>
            <h4 className={`${cardTitle} mb-4 text-[#ffe082]`}>Continuing or under evaluation</h4>
            <ul className={`${bulletList} marker:text-(--disclaimer-yellow)`}>{status.continuing.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section id="academic" className={subSection} aria-labelledby="academic-title">
        <h3 className={subTitle} id="academic-title" data-reveal>An academic project</h3>
        <p className={`${sectionLead} max-w-[820px]`} data-reveal>
          ThoraxScan is a capstone prototype for Radiologic Technology education. It is evaluated on functionality, integration and the model figures above. Clinical validation and production-grade deployment are outside its scope.
        </p>
        <ul className="mt-8 mb-0 flex list-none flex-wrap gap-2 p-0" data-reveal>
          {["Capstone project", "Radiologic Technology", "Chest X-ray", "Vision transformer", "In-browser AI", "Learning management"].map((tag) => (
            <li className="rounded-full border border-[rgb(168_211_255/32%)] px-4 py-1.5 text-[0.8125rem] font-semibold text-[#c3d0e2]" key={tag}>{tag}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
