import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "~/core/design-system/components";
import { LegalSections, type LegalSection } from "./legal-document";

interface LegalModalProps {
  isOpen: boolean;
  title: string;
  sections: LegalSection[];
  onClose: () => void;
}

export function LegalModal({ isOpen, title, sections, onClose }: LegalModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      data-theme="light"
      data-trust-mode="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-divider px-5 py-4 sm:px-8 sm:py-5">
          <h2 id="legal-modal-title" className="text-lg font-black text-text-primary sm:text-2xl">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup dokumen"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl font-bold text-text-tertiary transition-colors hover:bg-gray-100 hover:text-text-primary"
          >
            ✕
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <LegalSections sections={sections} />
        </div>

        <footer className="shrink-0 border-t border-divider bg-white px-5 py-4 sm:px-8">
          <Button type="button" onClick={onClose} fullWidth className="rounded-xl py-3 font-bold">
            Tutup
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
