import { useEffect, useRef } from "react";
import { Button } from "~/core/design-system/components";
import type { PromoData } from "../../infrastructure/promo.api";

export function DeactivatePromoDialog({ promo, isLoading, onConfirm, onClose }: {
  promo: PromoData | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!promo) return;
    cancelButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [promo, isLoading, onClose]);

  if (!promo) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isLoading) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="deactivate-promo-title" className="w-full max-w-md rounded-2xl bg-surface-primary p-6 shadow-xl">
        <h2 id="deactivate-promo-title" className="text-lg font-bold text-text-primary">Nonaktifkan promo?</h2>
        <p className="mt-2 text-sm text-text-secondary">Promo <strong>{promo.code}</strong> tidak dapat dipakai lagi setelah dinonaktifkan.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelButtonRef} type="button" variant="ghost" disabled={isLoading} onClick={onClose}>Batal</Button>
          <Button type="button" variant="primary" isLoading={isLoading} disabled={isLoading} onClick={onConfirm}>Nonaktifkan</Button>
        </div>
      </div>
    </div>
  );
}
