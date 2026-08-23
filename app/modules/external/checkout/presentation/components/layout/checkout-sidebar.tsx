import { Card, Button } from "~/core/design-system/components";
import type { AppliedPromo, OrderSummary } from "../../../domain/checkout.types";
import { OrderSummaryCard } from "../shared/order-summary-card";
import { PromoSection, PaymentConsent } from "../shared/payment-extras";

export interface CheckoutSidebarProps {
  summary: OrderSummary;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  className?: string;
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

/**
 * Sidebar for the combined data+payment-method step. No countdown timer here — the
 * reservation timer only starts once the buyer has committed to a payment method and
 * reached the QR/VA payment step, so this step never feels rushed.
 */
export function CheckoutSidebar({
  summary,
  onNext,
  onBack,
  isLoading,
  className = "",
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
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Section */}
      <OrderSummaryCard summary={summary} />

      {/* Actions Card */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm rounded-3xl">
        <PromoSection
          eventId={eventId}
          subtotal={summary.subtotal}
          serviceFee={summary.serviceFee}
          appliedPromo={appliedPromo}
          onApply={onApplyPromo}
          onRemove={onRemovePromo}
        />

        <PaymentConsent
          agreedToTerms={agreedToTerms}
          agreedToPrivacy={agreedToPrivacy}
          onToggleTerms={onToggleTerms}
          onTogglePrivacy={onTogglePrivacy}
          isMethodSelected={isMethodSelected}
        />

        <div className="flex gap-4">
          <button
            onClick={onBack}
            aria-label="Kembali"
            className="p-5 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
          >
            <svg className="h-6 w-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <Button
            onClick={onNext}
            isLoading={isLoading}
            className="flex-1 py-7 rounded-2xl text-lg font-black shadow-xl transition-all shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:-translate-y-0.5"
          >
            Lanjut ke Pembayaran
          </Button>
        </div>
      </Card>
    </div>
  );
}
