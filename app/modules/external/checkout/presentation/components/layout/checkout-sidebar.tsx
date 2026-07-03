import { Card, Button } from "~/core/design-system/components";
import type { AppliedPromo, OrderSummary } from "../../../domain/checkout.types";
import { CountdownTimer } from "../shared/countdown-timer";
import { OrderSummaryCard } from "../shared/order-summary-card";
import { PromoSection, PaymentConsent } from "../shared/payment-extras";

export interface CheckoutSidebarProps {
  summary: OrderSummary;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  className?: string;
  step?: number;
  agreedToTerms?: boolean;
  agreedToPrivacy?: boolean;
  onToggleTerms?: (val: boolean) => void;
  onTogglePrivacy?: (val: boolean) => void;
  isMethodSelected?: boolean;
  eventId?: string;
  appliedPromo?: AppliedPromo | null;
  onApplyPromo?: (promo: AppliedPromo) => void;
  onRemovePromo?: () => void;
}

export function CheckoutSidebar({
  summary,
  onNext,
  onBack,
  isLoading,
  className = "",
  step = 1,
  agreedToTerms = false,
  agreedToPrivacy = false,
  onToggleTerms = () => {},
  onTogglePrivacy = () => {},
  isMethodSelected = false,
  eventId = "",
  appliedPromo = null,
  onApplyPromo = () => {},
  onRemovePromo = () => {},
}: CheckoutSidebarProps) {
  const isStep2 = step === 2;
  const canSubmit = isStep2 ? (agreedToTerms && agreedToPrivacy && isMethodSelected) : true;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timer Section */}
      <CountdownTimer />

      {/* Summary Section */}
      <OrderSummaryCard summary={summary} />

      {/* Actions Card */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm rounded-3xl">
        {/* Promo Section - Only Step 2 */}
        {isStep2 && (
          <PromoSection
            eventId={eventId}
            subtotal={summary.subtotal}
            serviceFee={summary.serviceFee}
            appliedPromo={appliedPromo}
            onApply={onApplyPromo}
            onRemove={onRemovePromo}
          />
        )}

        {/* Checkboxes - Only Step 2 */}
        {isStep2 && (
          <PaymentConsent
            agreedToTerms={agreedToTerms}
            agreedToPrivacy={agreedToPrivacy}
            onToggleTerms={onToggleTerms}
            onTogglePrivacy={onTogglePrivacy}
            isMethodSelected={isMethodSelected}
          />
        )}

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="p-5 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
          >
            <svg className="h-6 w-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
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
