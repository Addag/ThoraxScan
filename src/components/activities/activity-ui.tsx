import type { ActivityStatus } from "@/lib/activities/types";
import type { ActivityAIStatus } from "@/lib/activity-ai/types";
import { glassPanelClass } from "@/components/dashboard-ui";

export function ActivityPanelTitle({ icon, title, titleId }: { icon: string; title: string; titleId: string }) {
  return <div className="flex min-h-[45px] items-center gap-2.5 border-b border-(--border-subtle) px-[13px]"><span className="text-[1.25rem]" aria-hidden="true">{icon}</span><h2 className="m-0 text-[0.875rem]" id={titleId}>{title}</h2></div>;
}

export function activityLayoutClass(variant: "default" | "new") {
  return `grid items-start gap-12 max-[1050px]:grid-cols-1 max-[1050px]:gap-5 ${variant === "new" ? "grid-cols-[minmax(240px,0.55fr)_minmax(0,1.45fr)]" : "grid-cols-[minmax(310px,0.72fr)_minmax(0,1.28fr)]"}`;
}

export const activityCaseColumnClass = "grid gap-3.5 max-[1050px]:grid-cols-2 max-[1050px]:items-start max-[760px]:grid-cols-1";
export const activityConfigColumnClass = "grid gap-3.5";

export const activitiesCtaClass =
  "transition-colors duration-160 hover:bg-[rgba(0,119,255,0.22)] flex min-h-[74px] items-center justify-between gap-5 rounded-panel border border-brand bg-[rgba(0,119,255,0.12)] px-5 py-4 text-(--text-primary) no-underline";

type StepState = "complete" | "active" | "future";

const stepMarkerClass: Record<StepState, string> = {
  complete: "bg-[#1f9d55] text-white",
  active: "bg-brand text-white",
  future: "border-2 border-(--border-strong) text-(--text-muted)",
};

// Professor: pass caseReady/published/aiStatus on an existing activity; a new draft passes nothing.
export function ActivityStepRail({ role, submissionStatus = "Not started", aiStatus, caseReady, published = false }: { role: "professor" | "student"; submissionStatus?: string; aiStatus?: ActivityAIStatus; caseReady?: boolean; published?: boolean }) {
  const submitted = submissionStatus === "Submitted";
  const aiState: StepState = aiStatus === "ready" ? "complete" : aiStatus === "pending" || aiStatus === "failed" ? "active" : "future";
  const steps: [string, StepState][] =
    role === "professor"
      ? [
          ["Upload case", caseReady === undefined ? "future" : caseReady ? "complete" : "active"],
          ["Configure activity", published ? "complete" : "active"],
          ["AI analysis", aiState],
        ]
      : [
          ["Review activity", submitted ? "complete" : "active"],
          [`Evaluation · ${submissionStatus}`, submitted ? "complete" : "active"],
          [`AI feedback · ${aiStatus === "ready" ? "Available" : aiStatus === "pending" ? "Pending" : aiStatus === "failed" ? "Retry available" : "Locked"}`, aiStatus === "ready" ? "complete" : submitted ? "active" : "future"],
        ];

  return (
    <ol className="m-0 mb-6 grid min-h-24 list-none grid-cols-3 rounded-panel border border-(--border-shell) p-0 [background:var(--glass-inset)] shadow-(--glass-inset-shadow) max-[760px]:grid-cols-1 max-[760px]:py-2.5" aria-label="Activity stages">
      {steps.map(([label, state], index) => (
        <li className={`relative grid min-w-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3.5 px-6 py-5 max-[760px]:min-h-[70px] max-[760px]:px-5 max-[760px]:py-3 ${state === "future" ? "opacity-70" : ""} ${index < 2 ? "after:absolute after:top-1/2 after:-right-3 after:z-[1] after:-translate-y-1/2 after:text-[1.5rem] after:leading-none after:text-(--text-muted) after:content-['→'] max-[760px]:after:top-auto max-[760px]:after:right-auto max-[760px]:after:bottom-[-12px] max-[760px]:after:left-9 max-[760px]:after:translate-y-0 max-[760px]:after:content-['↓']" : ""}`} key={label}>
          <span className={`grid size-11 place-items-center rounded-full text-[1rem] font-extrabold ${stepMarkerClass[state]}`} aria-hidden="true">{state === "complete" ? "✓" : index + 1}</span>
          <div className="grid">
            <strong className="text-[0.9375rem]">{label}<span className="sr-only">{state === "complete" ? " (done)" : state === "active" ? " (current)" : " (not yet)"}</span></strong>
            {state === "future" ? <small className="mt-0.5 text-[0.6875rem] text-(--text-muted)">{role === "student" ? "Locked until final submission" : "Future milestone"}</small> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  const colors = {
    draft: "text-(--status-warning-text) bg-[rgba(255,211,106,0.09)]",
    published: "text-(--status-success-text) bg-[rgba(95,255,119,0.08)]",
    archived: "text-(--text-muted) bg-[rgba(170,177,191,0.08)]",
  } as const;
  return <span className={`inline-flex items-center rounded-full border border-current px-[9px] py-1.5 text-[0.6875rem] font-extrabold uppercase leading-none tracking-[0.08em] ${colors[status]}`}>{status}</span>;
}

export function XrayCasePreview({
  imageUrl,
  title,
  status,
  imageError = false,
}: {
  imageUrl: string | null;
  title: string;
  status?: string | null;
  imageError?: boolean;
}) {
  return (
    <section className={`${glassPanelClass} border-(--border-shell)`} aria-labelledby="xray-preview-title">
      <ActivityPanelTitle icon="◉" title="Chest X-Ray Image" titleId="xray-preview-title" />
      <div className={`m-[9px] aspect-[1.48/1] overflow-hidden border-[5px] border-[#080a0e] bg-[#0f1622]`}>
        {imageUrl ? (
          // Signed URLs are short-lived and intentionally bypass the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="block size-full object-contain" src={imageUrl} alt={`Frontal chest X-ray for ${title}`} />
        ) : (
          <div className={`grid size-full place-items-center content-center gap-[5px] p-6 text-center text-[#aeb6c5]`}>
            <span className={`text-[2.125rem] font-normal text-white`} aria-hidden="true">＋</span>
            <strong>{imageError ? "Preview unavailable" : "No case image yet"}</strong>
            <small className="text-[0.6875rem]">{imageError ? "Reload to request a new signed preview URL." : "Upload a de-identified frontal JPEG or PNG."}</small>
          </div>
        )}
      </div>
      {status ? <p className="m-0 border-t border-(--border-subtle) px-3.5 py-2.5 text-[0.6875rem] capitalize text-(--text-muted)">Case status: <strong>{status}</strong></p> : null}
    </section>
  );
}

export function formatDueDate(dueAt: string | null) {
  if (!dueAt) return "No due date";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(dueAt));
}

export function dueState(dueAt: string | null) {
  if (!dueAt) return "Open-ended";
  return new Date(dueAt).getTime() < Date.now() ? "Overdue" : "Upcoming";
}

export function dueStateColor(dueAt: string | null) {
  return dueState(dueAt) === "Upcoming" ? "text-(--status-success-text)" : dueState(dueAt) === "Overdue" ? "text-(--status-error-text)" : "text-(--text-muted)";
}
