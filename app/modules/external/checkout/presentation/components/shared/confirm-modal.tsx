import { Button } from "~/core/design-system/components";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** "danger" tints the confirm button for a destructive action (e.g. cancelling an order). */
  variant?: "default" | "danger";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="text-center space-y-2">
          <h3 id="confirm-modal-title" className="text-lg font-black text-text-primary">
            {title}
          </h3>
          <p className="text-sm font-medium text-text-secondary leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-100 text-text-secondary font-bold hover:bg-gray-50 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold ${
              variant === "danger" ? "!bg-destructive hover:!bg-destructive-hover" : ""
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
