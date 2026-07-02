import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Card } from "~/core/design-system/components";
import { 
  OrderDetailsForm, 
  CheckoutSidebar, 
  EventInfoHeader, 
  CheckoutComingSoon, 
  PaymentMethodSelection, 
  OrderConfirmation, 
  CountdownTimer, 
  CheckoutStickyBar,
  OrderSummaryCard,
  PromoSection,
  PaymentConsent,
  PaymentInstruction,
  ImportantGuides,
   PaymentPartners,
   OrderSuccess,
   ManualTransferPending
 } from "./components";
import { useOrderSummary, withTransactionFee } from "./hooks/use-order-summary";
import { useCheckoutForm } from "./hooks/use-checkout-form";
import { useCheckoutSteps } from "./hooks/use-checkout-steps";
import { usePaymentSelection } from "./hooks/use-payment-selection";
import { eventApi } from "../../event/infrastructure/event.api";
import { brandApi } from "../../brand/infrastructure/brand.api";
import { paymentApi } from "../infrastructure/payment.api";
import { orderApi } from "../infrastructure/order.api";
import type { Route } from "./+types/checkout.page";

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const step = parseInt(url.searchParams.get("step") || "1", 10);
  const orderId = url.searchParams.get("orderId");

  const event = await eventApi.getEventById(params.eventId);
  if (!event) throw new Response("Not Found", { status: 404 });

  const [paymentMethods, order, brand] = await Promise.all([
    paymentApi.getPaymentMethods(),
    (step === 4 || step === 5) && orderId ? orderApi.getOrderById(orderId) : Promise.resolve(null),
    event.brandId ? brandApi.getBrandBySlug(event.brandId) : Promise.resolve(null),
  ]);

  return { event, paymentMethods, order, adminFee: brand?.adminFee ?? 0 };
}

export default function CheckoutPage({ loaderData }: Route.ComponentProps) {
  const { event, paymentMethods, order, adminFee } = loaderData;
  const [searchParams] = useSearchParams();

  // Application/Domain hooks
  const paymentSelectionState = usePaymentSelection();
  const discount = paymentSelectionState.selection.appliedPromo?.discount ?? 0;
  const summary = useOrderSummary(event, searchParams, adminFee, discount);
  const { buyerInfo, errors, validate, handleInputChange } = useCheckoutForm();

  // Steps orchestration hook (now managing payment state too)
  const {
    currentStep,
    isActionLoading,
    completedOrder,
    handleNext,
    handleBack,
    handleExpire,
    handlePaymentConfirmed,
    paymentSelection,
    selectedPaymentMethod,
    isManualTransferPending,
    manualTransferProofFile,
    setManualTransferProofFile,
    isStep2Valid,
    handlePaymentMethodSelect,
    setAgreedToTerms,
    setAgreedToPrivacy,
    applyPromo,
    removePromo
  } = useCheckoutSteps(event, buyerInfo, summary, validate, paymentMethods, order, paymentSelectionState);

  // Add "Biaya Transaksi" once a payment method is chosen (display total).
  const displaySummary = useMemo(
    () => withTransactionFee(summary, selectedPaymentMethod),
    [summary, selectedPaymentMethod],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);

  const displayStep = currentStep >= 4 ? 4 : currentStep;

  // View switch for special steps
  if (currentStep === 5) {
    if (isManualTransferPending) {
      return <ManualTransferPending event={event} orderId={searchParams.get("orderId")} onAction={() => handleNext()} />;
    }
    return <OrderSuccess event={event} order={completedOrder} onAction={() => handleNext()} />;
  }

  if (currentStep > 5) {
    return <CheckoutComingSoon />;
  }

  return (
    <div className="relative pb-32 lg:pb-0">
      <div className={`mx-auto max-w-7xl py-4 ${(currentStep === 3 || currentStep === 4) ? "space-y-10" : "grid grid-cols-1 gap-12 lg:grid-cols-12 items-start"}`}>
        {/* Main Content Area */}
        <div className={(currentStep === 3 || currentStep === 4) ? "w-full" : "lg:col-span-8 space-y-8"}>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
              <EventInfoHeader event={event} />
              {(currentStep === 3 || currentStep === 4) && (
                <div className="hidden md:block">
                   <CountdownTimer onExpire={handleExpire} />
                </div>
              )}
            </div>
          </div>

          {currentStep === 1 && (
            <OrderDetailsForm 
              data={buyerInfo} 
              errors={errors}
              onChange={handleInputChange} 
              className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
            />
          )}

          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <PaymentMethodSelection
                methods={paymentMethods}
                selectedMethodId={paymentSelection.methodId}
                onSelect={handlePaymentMethodSelect}
              />
            </div>
          )}

          {currentStep === 3 && (
            <OrderConfirmation
              buyerInfo={buyerInfo}
              summary={displaySummary}
              paymentMethod={selectedPaymentMethod}
              onNext={() => handleNext()}
              onBack={handleBack}
              isLoading={isActionLoading}
            />
          )}

          {currentStep === 4 && order && (
            <PaymentInstruction
              order={order}
              event={event}
              fallbackTotalAmount={
                completedOrder?.totalPrice && completedOrder.totalPrice > 0
                  ? completedOrder.totalPrice
                  : displaySummary.totalPrice
              }
              onAction={() => handleNext()}
              proofFile={manualTransferProofFile}
              onProofFileChange={setManualTransferProofFile}
              onBack={handleBack}
              onExpire={handleExpire}
              isLoading={isActionLoading}
              transactionId={searchParams.get("orderId") ?? searchParams.get("lockId")}
              onPaymentCompleted={handlePaymentConfirmed}
            />
          )}

          {/* Mobile Specific Sections */}
          {currentStep < 3 && (
            <div className="lg:hidden space-y-8">
              <OrderSummaryCard summary={displaySummary} />
              {currentStep === 2 && (
                <Card className="p-6 bg-white border-gray-100 shadow-sm rounded-3xl">
                  <PromoSection
                    eventId={event.id}
                    appliedPromo={paymentSelection.appliedPromo}
                    onApply={applyPromo}
                    onRemove={removePromo}
                  />
                  <PaymentConsent
                    agreedToTerms={paymentSelection.agreedToTerms}
                    agreedToPrivacy={paymentSelection.agreedToPrivacy}
                    onToggleTerms={setAgreedToTerms}
                    onTogglePrivacy={setAgreedToPrivacy}
                    isMethodSelected={!!paymentSelection.methodId}
                  />
                </Card>
              )}
            </div>
          )}

          {currentStep === 1 && <ImportantGuides />}
        </div>

        {/* Sidebar - Desktop Only */}
        {currentStep < 3 && (
          <aside className="lg:col-span-4 lg:sticky lg:top-28 hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700 delay-300 overflow-hidden">
            <div className="space-y-6 pb-12">
              <CheckoutSidebar
                summary={displaySummary}
                onNext={() => handleNext()}
                onBack={handleBack}
                step={currentStep}
                agreedToTerms={paymentSelection.agreedToTerms}
                agreedToPrivacy={paymentSelection.agreedToPrivacy}
                onToggleTerms={setAgreedToTerms}
                onTogglePrivacy={setAgreedToPrivacy}
                isMethodSelected={!!paymentSelection.methodId}
                eventId={event.id}
                appliedPromo={paymentSelection.appliedPromo}
                onApplyPromo={applyPromo}
                onRemovePromo={removePromo}
              />
              {currentStep === 1 && <PaymentPartners />}
            </div>
          </aside>
        )}
      </div>

      {/* Shared Sticky Bar (Mobile Only) */}
      <CheckoutStickyBar
        summary={displaySummary}
        currentStep={displayStep}
        onNext={() => handleNext()}
        onBack={handleBack}
        onExpire={handleExpire}
        isLoading={isActionLoading}
        canSubmit={
          currentStep === 2
            ? isStep2Valid
            : currentStep === 4 && (order?.paymentMethod.id === "manual" || order?.paymentMethod.id === "manual_transfer")
              ? !!manualTransferProofFile
              : true
        }
        orderCategory={order?.paymentMethod.category}
        orderMethodId={order?.paymentMethod.id}
      />
    </div>
  );
}
