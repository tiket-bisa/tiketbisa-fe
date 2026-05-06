import { Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import { CountdownTimer } from "./countdown-timer";
import type { OrderSummary } from "../../domain/checkout.types";

export interface CheckoutStickyBarProps {
  summary: OrderSummary;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onExpire?: () => void;
  isLoading?: boolean;
  canSubmit?: boolean;
}

export function CheckoutStickyBar({
  summary,
  currentStep,
  onNext,
  onBack,
  onExpire,
  isLoading,
  canSubmit = true,
}: CheckoutStickyBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden animate-in slide-in-from-bottom duration-500">
      {/* Timer - Full width and attached to the bar */}
      <div className="w-full bg-white border-t border-gray-100">
          <CountdownTimer 
            onExpire={onExpire}
            className="!py-3 !px-6 !rounded-none !shadow-none border-x-0 border-t-0 border-b border-gray-50" 
          />
      </div>

      {/* Main Sticky Bar */}
      <div className="bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] px-5 py-4 pb-8 flex items-center justify-between gap-4">
        {/* Left: Total Price */}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest leading-none">
            Total Bayar
          </span>
          <span className="text-xl font-black text-brand-primary mt-1">
            {formatIDR(summary.totalPrice)}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-4 border-2 border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-100 transition-all active:scale-95"
          >
            <svg className="h-5 w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <Button
            onClick={onNext}
            isLoading={isLoading}
            disabled={!canSubmit}
            className={`h-12 px-8 rounded-2xl text-base font-black shadow-lg transition-all active:scale-95 ${
              canSubmit 
                ? "bg-brand-primary shadow-brand-primary/20" 
                : "bg-brand-primary/30 shadow-none grayscale"
            }`}
          >
            {currentStep === 3 ? "Bayar Sekarang" : "Lanjut"}
          </Button>
        </div>
      </div>
    </div>
  );
}
