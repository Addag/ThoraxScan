"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { button } from "@/components/controls";

// Mount only while confirming, inside the <form> whose submission it confirms:
// the confirm button submits that form, and the dialog closes once submission starts.
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  name,
  value,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  name?: string;
  value?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { pending } = useFormStatus();

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  useEffect(() => {
    if (pending) onClose();
  }, [pending, onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-panel border border-(--border-shell) bg-(--surface-raised) [background-image:var(--glass-surface)] p-6 text-left text-(--text-primary) shadow-(--glass-shadow) backdrop:bg-[rgb(0_4_18/60%)] backdrop:backdrop-blur-[3px] max-[520px]:p-5"
    >
      <h2 id={titleId} className="m-0 text-[1rem] font-extrabold">{title}</h2>
      <div className="mt-2.5 text-[0.8125rem] leading-[1.5] text-(--text-secondary)">{children}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2.5 max-[520px]:flex-col-reverse max-[520px]:items-stretch">
        <button className={button("secondary")} type="button" onClick={onClose}>{cancelLabel}</button>
        <button className={button(danger ? "danger" : "primary")} type="submit" name={name} value={value}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
