import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Card } from "~/core/design-system/components";
import { MAX_TICKETS_PER_ORDER } from "../domain/checkout.types";
import {
  OrderDetailsForm,
  CheckoutSidebar,
  EventInfoHeader,
  CheckoutComingSoon,
  PaymentMethodSelection,
  ConfirmModal,
  CountdownTimer,
  CheckoutStickyBar,
  OrderSummaryCard,
  PromoSection,
  PaymentConsent,
  PaymentInstruction,
  ImportantGuides,
   OrderSuccess,
   ManualTransferPending
 } from "./components";
import { useOrderSummary } from "./hooks/use-order-summary";
import { useCheckoutForm } from "./hooks/use-checkout-form";
import { useCheckoutSteps } from "./hooks/use-checkout-steps";
import { usePaymentSelection } from "./hooks/use-payment-selection";
import { buildPaymentOrderSummary } from "../domain/checkout.pricing";
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
  const { event, paymentMethods, order } = loaderData;
  const [searchParams] = useSearchParams();

  // Application/Domain hooks
  const paymentSelectionState = usePaymentSelection();
  const discount = paymentSelectionState.selection.appliedPromo?.discount ?? 0;
  const summary = useOrderSummary(event, searchParams, discount);
  const {
    buyerInfo,
    errors,
    validate,
    handleInputChange,
    holders,
    holderErrors,
    sameAsMain,
    syncHolderCount,
    handleHolderChange,
    handleToggleSameAsMain,
  } = useCheckoutForm();

  const totalTicketQuantity = useMemo(
    () => summary.items.reduce((sum, item) => sum + item.quantity, 0),
    [summary.items],
  );

  useEffect(() => {
    syncHolderCount(totalTicketQuantity);
  }, [totalTicketQuantity, syncHolderCount]);

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
    canProceedToPayment,
    handlePaymentMethodSelect,
    setBankCode,
    setAgreedToTerms,
    setAgreedToPrivacy,
    applyPromo,
    removePromo,
    blockingError,
    clearBlockingError
  } = useCheckoutSteps(event, buyerInfo, summary, validate, paymentMethods, order, paymentSelectionState, holders);

  // Confirmation modals: submitting step 1 locks the reservation and starts the payment
  // timer, and cancelling from the payment step releases that lock - both are consequential
  // enough to double-check before firing the real action.
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const requestProceedToPayment = () => setShowProceedConfirm(true);
  const confirmProceedToPayment = () => {
    setShowProceedConfirm(false);
    handleNext();
  };

  const requestCancelOrder = () => setShowCancelConfirm(true);
  const confirmCancelOrder = () => {
    setShowCancelConfirm(false);
    handleBack();
  };

  // Adds "Biaya Transaksi" once a payment method is chosen; gracefully has no fee yet
  // otherwise, so this is safe to use as the one live summary throughout the combined
  // data+payment-method page (the total updates the instant a method is picked).
  const paymentSummary = useMemo(
    () => buildPaymentOrderSummary(summary, selectedPaymentMethod ?? order?.paymentMethod ?? null),
    [summary, selectedPaymentMethod, order?.paymentMethod],
  );
  const activeSummary = paymentSummary;

  // After "Bayar Sekarang" creates the Xendit invoice, the fresh QR/VA payload arrives on
  // `completedOrder`. Overlay it onto the loader order so PaymentInstruction renders the QR
  // immediately instead of waiting up to ~5s for the next status poll to catch up.
  const paymentInstructionOrder = useMemo(() => {
    if (!order || !completedOrder) return order;
    return {
      ...order,
      virtualAccount: completedOrder.virtualAccount ?? order.virtualAccount,
      qrPayload: completedOrder.qrPayload ?? order.qrPayload,
      gatewayStatus: completedOrder.gatewayStatus ?? order.gatewayStatus,
      gatewayExpiry: completedOrder.gatewayExpiry ?? order.gatewayExpiry,
    };
  }, [order, completedOrder]);

  useEffect(() => {
    sessionStorage.setItem("tiketbisa_checkout_summary", JSON.stringify(activeSummary));
  }, [activeSummary]);

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
      {blockingError && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <span>{blockingError}</span>
            <button
              type="button"
              onClick={clearBlockingError}
              aria-label="Tutup pesan kesalahan"
              className="shrink-0 font-bold text-red-500 hover:text-red-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className={`mx-auto max-w-7xl py-4 ${currentStep === 4 ? "space-y-10" : "grid grid-cols-1 gap-12 lg:grid-cols-12 items-start"}`}>
        {/* Main Content Area */}
        <div className={currentStep === 4 ? "w-full" : "lg:col-span-8 space-y-8"}>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
              <EventInfoHeader event={event} />
              {/* Timer is deliberately absent on step 1 (data + payment method) — it only
                  starts once the buyer has committed to a payment method and reached the
                  payment step, so filling in personal data never feels rushed. */}
              {currentStep === 4 && (
                <div className="hidden md:block">
                   <CountdownTimer onExpire={handleExpire} />
                </div>
              )}
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-8">
              <OrderDetailsForm
                data={buyerInfo}
                errors={errors}
                onChange={handleInputChange}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
                items={summary.items}
                holders={holders}
                holderErrors={holderErrors}
                sameAsMain={sameAsMain}
                onHolderChange={handleHolderChange}
                onToggleSameAsMain={handleToggleSameAsMain}
                ticketCapNotice={
                  totalTicketQuantity > MAX_TICKETS_PER_ORDER
                    ? `Maksimal ${MAX_TICKETS_PER_ORDER} tiket per transaksi. Kurangi jumlah tiket sebelum melanjutkan.`
                    : null
                }
              />

              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-text-primary mb-2">Metode Pembayaran</h2>
                  <p className="text-text-secondary font-medium">
                    Pilih metode pembayaran yang paling nyaman untukmu.
                  </p>
                </div>
                <PaymentMethodSelection
                  methods={paymentMethods}
                  selectedMethodId={paymentSelection.methodId}
                  onSelect={handlePaymentMethodSelect}
                  selectedBankCode={paymentSelection.bankCode}
                  onSelectBank={setBankCode}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && order && (
              <PaymentInstruction
              order={paymentInstructionOrder ?? order}
              event={event}
              fallbackTotalAmount={
                completedOrder?.totalPrice && completedOrder.totalPrice > 0
                  ? completedOrder.totalPrice
                  : paymentSummary.totalPrice
              }
              onAction={() => handleNext()}
              proofFile={manualTransferProofFile}
              onProofFileChange={setManualTransferProofFile}
              onBack={requestCancelOrder}
              onExpire={handleExpire}
              isLoading={isActionLoading}
              transactionId={searchParams.get("orderId") ?? searchParams.get("lockId")}
              onPaymentCompleted={handlePaymentConfirmed}
            />
          )}

          {/* Mobile Specific Sections */}
          {currentStep === 1 && (
            <div className="lg:hidden space-y-8">
              <OrderSummaryCard summary={activeSummary} />
              <Card className="p-6 bg-white border-gray-100 shadow-sm rounded-3xl">
                <PromoSection
                  eventId={event.id}
                  subtotal={summary.subtotal}
                  serviceFee={summary.serviceFee}
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
            </div>
          )}

          {currentStep === 1 && <ImportantGuides />}
        </div>

        {/* Sidebar - Desktop Only */}
        {currentStep === 1 && (
          <aside className="lg:col-span-4 lg:sticky lg:top-28 hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700 delay-300 overflow-hidden">
            <div className="space-y-6 pb-12">
              <CheckoutSidebar
                summary={activeSummary}
                onNext={requestProceedToPayment}
                onBack={handleBack}
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
            </div>
          </aside>
        )}
      </div>

      {/* Shared Sticky Bar (Mobile Only) */}
      <CheckoutStickyBar
        summary={activeSummary}
        currentStep={displayStep}
        onNext={() => (currentStep === 1 ? requestProceedToPayment() : handleNext())}
        onBack={() => (currentStep === 4 ? requestCancelOrder() : handleBack())}
        onExpire={handleExpire}
        isLoading={isActionLoading}
        canSubmit={
          currentStep === 1
            ? canProceedToPayment
            : currentStep === 4 && (order?.paymentMethod.id === "manual" || order?.paymentMethod.id === "manual_transfer")
              ? !!manualTransferProofFile
              : true
        }
        orderCategory={order?.paymentMethod.category}
        orderMethodId={order?.paymentMethod.id}
      />

      <ConfirmModal
        isOpen={showProceedConfirm}
        title="Lanjutkan ke Pembayaran?"
        message="Tiketmu akan dikunci dan batas waktu pembayaran mulai berjalan setelah ini. Pastikan data yang kamu isi sudah benar."
        confirmLabel="Ya, Lanjutkan"
        cancelLabel="Batal"
        onConfirm={confirmProceedToPayment}
        onCancel={() => setShowProceedConfirm(false)}
        isLoading={isActionLoading}
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Batalkan Pesanan?"
        message="Tiket yang sudah dikunci untukmu akan dilepas. Kamu perlu memesan ulang dari awal jika berubah pikiran."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Kembali"
        variant="danger"
        onConfirm={confirmCancelOrder}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
