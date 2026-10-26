import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "../button";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Batal",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();
    return () => previousFocus?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-primary p-6 shadow-xl"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isLoading) {
            event.stopPropagation();
            onCancel();
          }
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold text-text-primary">{title}</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelButtonRef} type="button" variant="secondary" disabled={isLoading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="primary" isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
