import Link from "next/link";

import type { ActivityStatus } from "@/lib/activities/types";

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
    <div className="activity-page-heading">
      <div>
        {backHref ? <Link href={backHref}>← Back to activities</Link> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <time dateTime={new Date().toISOString().slice(0, 10)}>
        {new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date())}
      </time>
    </div>
  );
}

export function ActivityStepRail({ role }: { role: "professor" | "student" }) {
  const steps =
    role === "professor"
      ? [
          ["1", "Upload case", "complete"],
          ["2", "Configure activity", "active"],
          ["3", "AI analysis", "future"],
        ]
      : [
          ["1", "Review activity", "active"],
          ["2", "Submit evaluation", "future"],
          ["3", "AI explanation", "future"],
        ];

  return (
    <ol className="activity-step-rail" aria-label="Activity stages">
      {steps.map(([number, label, state]) => (
        <li className={`activity-step activity-step--${state}`} key={label}>
          <span aria-hidden="true">{number}</span>
          <strong>{label}</strong>
          {state === "future" ? <small>Future milestone</small> : null}
        </li>
      ))}
    </ol>
  );
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return <span className={`activity-status activity-status--${status}`}>{status}</span>;
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
    <section className="activity-xray-panel" aria-labelledby="xray-preview-title">
      <div className="activity-panel-title">
        <span aria-hidden="true">◉</span>
        <h2 id="xray-preview-title">Chest X-Ray Image</h2>
      </div>
      <div className={`activity-xray-frame activity-xray-frame--${darkImageBackground ? "dark" : "light"}`}>
        {imageUrl ? (
          // Signed URLs are short-lived and intentionally bypass the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`Frontal chest X-ray for ${title}`} />
        ) : (
          <div className="activity-xray-placeholder">
            <span aria-hidden="true">＋</span>
            <strong>{imageError ? "Preview unavailable" : "No case image yet"}</strong>
            <small>{imageError ? "Reload to request a new signed preview URL." : "Upload a de-identified frontal JPEG or PNG."}</small>
          </div>
        )}
      </div>
      {status ? <p className="activity-case-status">Case status: <strong>{status}</strong></p> : null}
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
