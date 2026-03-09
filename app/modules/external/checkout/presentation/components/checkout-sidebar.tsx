import { Card, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { OrderSummary } from "../../domain/checkout.types";
import { CountdownTimer } from "./countdown-timer";
import { Link } from "react-router";

export interface CheckoutSidebarProps {
  summary: OrderSummary;
  onNext: () => void;
  isLoading?: boolean;
  className?: string;
  step?: number;
  agreedToTerms?: boolean;
  agreedToPrivacy?: boolean;
  onToggleTerms?: (val: boolean) => void;
  onTogglePrivacy?: (val: boolean) => void;
  isMethodSelected?: boolean;
}

export function CheckoutSidebar({
  summary,
  onNext,
  isLoading,
  className = "",
  step = 1,
  agreedToTerms,
  agreedToPrivacy,
  onToggleTerms,
  onTogglePrivacy,
  isMethodSelected = false,
}: CheckoutSidebarProps) {
  const isStep2 = step === 2;
  const canSubmit = isStep2 ? (agreedToTerms && agreedToPrivacy && isMethodSelected) : true;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timer Section */}
      <CountdownTimer />

      {/* Summary Card */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm rounded-3xl">
        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-primary rounded-full" />
          Rincian Pesanan
        </h2>
        
        <div className="space-y-6 mb-8">
          {summary.items.map((item) => (
            <div key={item.ticketId} className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900 leading-tight">{item.ticketName}</p>
                <p className="text-xs text-gray-500 font-medium">
                  {item.quantity}x {formatIDR(item.price)}
                </p>
              </div>
              <p className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
                {formatIDR(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Subtotal</span>
            <span className="text-sm font-bold text-gray-900">{formatIDR(summary.subtotal)}</span>
          </div>
          
          {summary.tax > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Pajak Daerah</span>
              <span className="text-sm font-bold text-gray-900">{formatIDR(summary.tax)}</span>
            </div>
          )}

          {summary.serviceFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Biaya Layanan</span>
              <span className="text-sm font-bold text-gray-900">{formatIDR(summary.serviceFee)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-5 border-t-2 border-dashed border-gray-100 mt-2">
            <span className="text-sm font-bold text-gray-900">Total Bayar</span>
            <span className="text-xl font-black text-brand-primary">
              {formatIDR(summary.totalPrice)}
            </span>
          </div>
        </div>

        {/* Promo Section - Only Step 2 */}
        {isStep2 && (
          <div className="mt-8">
            <button className="w-full py-4 px-6 border-2 border-dashed border-brand-primary/20 rounded-2xl bg-brand-primary/[0.02] flex items-center justify-center gap-3 group hover:border-brand-primary/40 transition-all">
              <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-sm font-black text-brand-primary/60 group-hover:text-brand-primary transition-colors">
                Lebih hemat pakai promo
              </span>
            </button>
          </div>
        )}

        {/* Checkboxes - Only Step 2 */}
        {isStep2 && (
          <div className="mt-10 space-y-4">
            {!isMethodSelected && (
              <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mb-4">
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
              <span className="text-xs font-bold text-gray-600 leading-tight select-none">
                Saya menyetujui <Link to="/terms" className="text-brand-primary hover:underline">Syarat & Ketentuan</Link> yang berlaku di Artatix
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
              <span className="text-xs font-bold text-gray-600 leading-tight select-none">
                Saya menyetujui <Link to="/privacy" className="text-brand-primary hover:underline">Kebijakan Privasi & Pemrosesan Data</Link> yang berlaku di Artatix
              </span>
            </label>
          </div>
        )}

        <div className={`mt-10 flex gap-4 ${!isStep2 ? "flex-col" : ""}`}>
          {isStep2 && (
            <button
              onClick={() => window.history.back()}
              className="p-5 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
            >
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <Button
            onClick={onNext}
            isLoading={isLoading}
            disabled={!canSubmit}
            className={`flex-1 py-7 rounded-2xl text-lg font-black shadow-xl transition-all ${
              canSubmit 
                ? "shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:-translate-y-0.5" 
                : "bg-brand-primary/30 shadow-none cursor-not-allowed"
            }`}
          >
            {isStep2 ? "Bayar Sekarang" : "Lanjut ke Pembayaran"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
