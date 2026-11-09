"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { button } from "@/components/controls";

/**
 * Pops its content up once, then leaves it on the page after closing.
 * It is one element both ways (a closed dialog is styled as a plain block), so open details and heatmap choices survive.
 */
export function ResultDialog({ popUp, label, children }: { popUp: boolean; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(popUp);
  // A layout effect runs before the passive effect that opens the Possible findings warning, so the warning lands on top.
  useLayoutEffect(() => { if (popUp && ref.current && !ref.current.open) ref.current.showModal(); }, [popUp]);
  return <dialog ref={ref} aria-label={label} tabIndex={-1} onClose={(event) => { if (event.target !== ref.current) return; /* React bubbles the warning's close here too. */ setOpen(false); ref.current?.focus(); }}
    className="text-left outline-none not-open:static not-open:block not-open:w-full not-open:max-w-none not-open:bg-transparent not-open:text-inherit open:m-auto open:max-h-[calc(100dvh-32px)] open:w-[min(880px,calc(100vw-32px))] open:max-w-none open:overflow-y-auto open:rounded-panel open:border open:border-(--border-shell) open:bg-(--surface-raised) open:text-(--text-primary) open:shadow-(--glass-shadow) backdrop:bg-[rgb(0_4_18/60%)] backdrop:backdrop-blur-[3px]">
    {open ? <div className="sticky top-0 z-10 flex justify-end border-b border-b-(--border-subtle) bg-(--surface-raised) p-3"><button className={button("secondary")} type="button" onClick={() => ref.current?.close()}>Close result</button></div> : null}
    {children}
  </dialog>;
}
