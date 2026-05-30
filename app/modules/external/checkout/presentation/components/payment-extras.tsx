import { Link } from "react-router";

export function PromoSection() {
  return (
    <div className="mb-8">
      <button className="w-full py-4 px-6 border-2 border-dashed border-brand-primary/20 rounded-2xl bg-brand-primary/[0.02] flex items-center justify-center gap-3 group hover:border-brand-primary/40 transition-all">
        <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        <span className="text-sm font-black text-brand-primary/60 group-hover:text-brand-primary transition-colors">
          Lebih hemat pakai promo
        </span>
      </button>
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
          <svg className="absolute h-3.5 w-3.5 opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
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
          <svg className="absolute h-3.5 w-3.5 opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
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
