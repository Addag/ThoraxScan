import Link from "next/link";

import type { ActivityStatus } from "@/lib/activities/types";
import type { ActivityAIStatus } from "@/lib/activity-ai/types";
import { glassPanelClass } from "@/components/dashboard-ui";

export function ActivityPanelTitle({ icon, title, titleId }: { icon: string; title: string; titleId: string }) {
  return <div className="flex min-h-[45px] items-center gap-2.5 border-b border-[#566071] px-[13px]"><span className="text-[20px]" aria-hidden="true">{icon}</span><h2 className="m-0 text-[14px]" id={titleId}>{title}</h2></div>;
}

export function activityLayoutClass(variant: "default" | "new") {
  return `grid items-start gap-12 max-[1050px]:grid-cols-1 max-[1050px]:gap-5 ${variant === "new" ? "grid-cols-[minmax(240px,0.55fr)_minmax(0,1.45fr)]" : "grid-cols-[minmax(310px,0.72fr)_minmax(0,1.28fr)]"}`;
}

export const activityCaseColumnClass = "grid gap-3.5 max-[1050px]:grid-cols-2 max-[1050px]:items-start max-[760px]:grid-cols-1";
export const activityConfigColumnClass = "grid gap-3.5";

export function activityFormMessageClass(status: string) {
  const tone = status === "error" || status === "unauthorized" ? "bg-[rgba(255,55,69,0.1)] text-[#ff9299]" : status === "success" ? "bg-[rgba(36,255,61,0.09)] text-[#7dff8c]" : "bg-[rgba(0,119,255,0.12)] text-[#9fcfff]";
  return `mx-0 mt-3 mb-0 rounded-[4px] px-[11px] py-[9px] text-[11px] leading-[1.4] ${tone}`;
}

export const activityFormHeadingClass = "mb-[17px] flex items-center gap-[13px]";
export const activityFormHeadingIconClass = "text-[31px] text-brand";
export const activityFormHeadingKickerClass = "mx-0 mt-0 mb-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8e96a4]";
export const activityFormHeadingTitleClass = "m-0 text-[30px] max-[520px]:text-[25px]";

export const activitiesCtaClass =
  "mt-5 flex min-h-[74px] items-center justify-between gap-5 rounded-[9px] border border-brand bg-[rgba(0,119,255,0.12)] px-5 py-4 text-white no-underline";

export function ActivityPageHeading({
  title = "Activities",
  description,
  backHref,
}: {
  title?: string;
  description: string;
  backHref?: string;
}) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        {backHref ? <Link className="mb-3 inline-block text-[12px] font-extrabold text-[#9fcfff] no-underline" href={backHref}>← Back to activities</Link> : null}
        <h1 className="m-0 text-[clamp(28px,4vw,38px)] leading-[1.1]">{title}</h1>
        <p className="mt-1.5 mb-0 text-[13px] leading-[1.4] text-[#c3d0e2]">{description}</p>
      </div>
      <time className="flex-none rounded-[4px] bg-[rgba(85,85,85,0.75)] px-[15px] py-[9px] text-[11px] text-white max-[760px]:self-start" dateTime={new Date().toISOString().slice(0, 10)}>
        {new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date())}
      </time>
    </div>
  );
}

export function ActivityStepRail({ role, submissionStatus = "Not started", aiStatus }: { role: "professor" | "student"; submissionStatus?: string; aiStatus?: ActivityAIStatus }) {
  const steps =
    role === "professor"
      ? [
          ["1", "Upload case", "complete"],
          ["2", "Configure activity", "active"],
          ["3", "AI analysis", "active"],
        ]
      : [
          ["1", "Review activity", "active"],
          ["2", `Evaluation · ${submissionStatus}`, submissionStatus === "Submitted" ? "complete" : "active"],
          ["3", `AI feedback · ${aiStatus === "ready" ? "Available" : aiStatus === "pending" ? "Pending" : aiStatus === "failed" ? "Retry available" : "Locked"}`, submissionStatus === "Submitted" ? "active" : "future"],
        ];

  return (
    <ol className="m-0 mb-7 grid min-h-24 list-none grid-cols-3 rounded-[11px] border border-[#aeb2b8] p-0 [background:var(--glass-inset)] shadow-(--glass-inset-shadow) max-[760px]:grid-cols-1 max-[760px]:py-2.5" aria-label="Activity stages">
      {steps.map(([number, label, state]) => (
        <li className={`relative grid min-w-0 grid-cols-[44px_minmax(0,1fr)] content-center items-center gap-x-3.5 px-[34px] py-[19px] max-[760px]:min-h-[70px] max-[760px]:px-5 max-[760px]:py-3 ${state === "future" ? "opacity-[0.42]" : ""} ${number !== "3" ? "after:absolute after:top-1/2 after:-right-[30px] after:z-[1] after:h-px after:w-[60px] after:bg-[#58606b] after:content-[''] max-[760px]:after:bottom-[-8px] max-[760px]:after:left-[41px] max-[760px]:after:top-auto max-[760px]:after:right-auto max-[760px]:after:h-4 max-[760px]:after:w-px" : ""}`} key={label}>
          <span className="row-span-2 grid size-11 place-items-center rounded-full bg-brand text-[16px] font-extrabold text-white" aria-hidden="true">{number}</span>
          <strong className="text-[15px]">{label}</strong>
          {state === "future" ? <small className="mt-0.5 text-[10px] text-[#7b818c]">{role === "student" ? "Locked until final submission" : "Future milestone"}</small> : null}
        </li>
      ))}
    </ol>
  );
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  const colors = {
    draft: "text-[#ffd36a] bg-[rgba(255,211,106,0.09)]",
    published: "text-[#5fff77] bg-[rgba(95,255,119,0.08)]",
    archived: "text-[#aab1bf] bg-[rgba(170,177,191,0.08)]",
  } as const;
  return <span className={`inline-flex items-center rounded-[999px] border border-current px-[9px] py-1.5 text-[10px] font-extrabold uppercase leading-none tracking-[0.08em] ${colors[status]}`}>{status}</span>;
}

export function XrayCasePreview({
  imageUrl,
  title,
  status,
  imageError = false,
  darkImageBackground = true,
}: {
  imageUrl: string | null;
  title: string;
  status?: string | null;
  imageError?: boolean;
  darkImageBackground?: boolean;
}) {
  return (
    <section className={`${glassPanelClass} border-[#33425c]`} aria-labelledby="xray-preview-title">
      <ActivityPanelTitle icon="◉" title="Chest X-Ray Image" titleId="xray-preview-title" />
      <div className={`m-[9px] aspect-[1.48/1] overflow-hidden border-[5px] ${darkImageBackground ? "border-[#080a0e] bg-[#0f1622]" : "border-[#c4cad4] bg-[#e5e9ef]"}`}>
        {imageUrl ? (
          // Signed URLs are short-lived and intentionally bypass the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="block size-full object-contain" src={imageUrl} alt={`Frontal chest X-ray for ${title}`} />
        ) : (
          <div className="grid size-full place-items-center content-center gap-[5px] p-[22px] text-center text-[#8d96a5]">
            <span className="text-[34px] font-light text-white" aria-hidden="true">＋</span>
            <strong>{imageError ? "Preview unavailable" : "No case image yet"}</strong>
            <small className="text-[10px] text-[#6f7887]">{imageError ? "Reload to request a new signed preview URL." : "Upload a de-identified frontal JPEG or PNG."}</small>
          </div>
        )}
      </div>
      {status ? <p className="m-0 border-t border-[#566071] px-3.5 py-2.5 text-[11px] capitalize text-[#aab1bf]">Case status: <strong>{status}</strong></p> : null}
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
  return dueState(dueAt) === "Upcoming" ? "text-[#7dff8c]" : dueState(dueAt) === "Overdue" ? "text-[#ff8d95]" : "text-[#aeb6c5]";
}
