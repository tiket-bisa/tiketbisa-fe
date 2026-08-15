import { useState } from "react";
import { Link } from "react-router";
import { Input, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import { promoApi } from "../../../infrastructure/promo.api";
import type { AppliedPromo } from "../../../domain/checkout.types";

export interface PromoSectionProps {
  eventId: string;
  /** Pre-discount base (subtotal + biaya layanan) the discount is computed against. */
  subtotal: number;
  serviceFee: number;
  appliedPromo?: AppliedPromo | null;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
}

export function PromoSection({ eventId, subtotal, serviceFee, appliedPromo, onApply, onRemove }: PromoSectionProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await promoApi.applyPromo(trimmedCode, eventId, subtotal, serviceFee);
      onApply({ promoId: result.promoId, code: trimmedCode, discount: result.discount });
      setCode("");
    } catch (err: any) {
      setError(err?.message || "Kode promo tidak valid");
    } finally {
      setIsLoading(false);
    }
  };

  if (appliedPromo) {
    return (
      <div className="mb-8 p-4 rounded-2xl border-2 border-success-text/20 bg-success-text/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-success-text flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-bold text-success-text">
            Kode promo berhasil diterapkan: -{formatIDR(appliedPromo.discount)}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs font-black text-text-tertiary hover:text-destructive-text uppercase tracking-widest transition-colors flex-shrink-0 cursor-pointer"
        >
          Hapus
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <Input
            placeholder="Masukkan kode promo"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleApply();
              }
            }}
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleApply}
          isLoading={isLoading}
          disabled={!code.trim()}
          className="px-6 rounded-lg"
        >
          Terapkan
        </Button>
      </div>
      {error && <p className="text-xs font-bold text-destructive-text">{error}</p>}
    </div>
  );
}

interface PaymentConsentProps {
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  onToggleTerms: (val: boolean) => void;
  onTogglePrivacy: (val: boolean) => void;
  isMethodSelected: boolean;
}

export function PaymentConsent({
  agreedToTerms,
  agreedToPrivacy,
  onToggleTerms,
  onTogglePrivacy,
  isMethodSelected,
}: PaymentConsentProps) {
  return (
    <div className="mb-10 space-y-4">
      {!isMethodSelected && (
        <p className="text-[10px] font-bold text-text-tertiary text-center uppercase tracking-widest mb-4">
          Silakan pilih metode pembayaran terlebih dahulu
        </p>
      )}
      
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center mt-0.5">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => onToggleTerms?.(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-200 checked:border-brand-primary checked:bg-brand-primary transition-all"
          />
          <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-bold text-text-secondary leading-tight select-none">
          Saya menyetujui <Link to="/terms" className="text-brand-primary hover:underline">Syarat & Ketentuan</Link> yang berlaku di Tiketbisa
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center mt-0.5">
          <input
            type="checkbox"
            checked={agreedToPrivacy}
            onChange={(e) => onTogglePrivacy?.(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-200 checked:border-brand-primary checked:bg-brand-primary transition-all"
          />
          <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-bold text-text-secondary leading-tight select-none">
          Saya menyetujui <Link to="/privacy" className="text-brand-primary hover:underline">Kebijakan Privasi & Pemrosesan Data</Link> yang berlaku di Tiketbisa
        </span>
      </label>
    </div>
  );
}
