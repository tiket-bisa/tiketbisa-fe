import { useSearchParams, useNavigate, useParams } from "react-router";
import { useEffect } from "react";
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
  PaymentConsent
} from "./components";
import { useOrderSummary } from "./hooks/use-order-summary";
import { useCheckoutForm } from "./hooks/use-checkout-form";
import { usePaymentSelection } from "./hooks/use-payment-selection";
import { useOrderConfirmation } from "./hooks/use-order-confirmation";
import { eventApi } from "../../event/infrastructure/event.api";
import { paymentApi } from "../infrastructure/payment.api";
import type { Route } from "./+types/checkout.page";

export async function loader({ params }: Route.LoaderArgs) {
  const [event, paymentMethods] = await Promise.all([
    eventApi.getEventById(params.eventId),
    paymentApi.getPaymentMethods(),
  ]);

  if (!event) throw new Response("Not Found", { status: 404 });
  return { event, paymentMethods };
}

export default function CheckoutPage({ loaderData }: Route.ComponentProps) {
  const { event, paymentMethods } = loaderData;
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);

  // Smooth scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);

  // Hooks for logic
  const summary = useOrderSummary(event, searchParams);
  const { buyerInfo, errors, validate, handleInputChange } = useCheckoutForm();
  const { 
    selection, 
    setMethodId, 
    setAgreedToTerms, 
    setAgreedToPrivacy 
  } = usePaymentSelection();
  const { confirmOrder, isLoading } = useOrderConfirmation();

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selection.methodId);
  
  // Logic for submit availability on Step 2
  const isStep2Valid = !!(selection.methodId && selection.agreedToTerms && selection.agreedToPrivacy);

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validate()) {
        setSearchParams({ ...Object.fromEntries(searchParams), step: "2" });
      }
    } else if (currentStep === 2) {
      if (isStep2Valid) {
        setSearchParams({ ...Object.fromEntries(searchParams), step: "3" });
      }
    } else if (currentStep === 3) {
       if (selectedPaymentMethod) {
         const result = await confirmOrder({
           buyerInfo,
           summary,
           paymentMethod: selectedPaymentMethod
         });
         
         if (result) {
            setSearchParams({ 
              ...Object.fromEntries(searchParams), 
              step: "4", 
              orderId: result.orderId 
            });
         }
       }
    }
  };

  const clearCheckoutData = () => {
    sessionStorage.removeItem("tiketbisa_checkout_deadline");
    sessionStorage.removeItem("tiketbisa_buyer_info");
    sessionStorage.removeItem("tiketbisa_payment_selection");
  };

  const handleBack = () => {
    if (currentStep === 1) {
      clearCheckoutData();
      navigate(`/event/${params.eventId}`);
    } else {
      navigate(-1);
    }
  };

  const handleExpire = () => {
    clearCheckoutData();
    navigate(`/event/${params.eventId}`);
  };

  // Step 4+ View 
  if (currentStep > 3) {
    return <CheckoutComingSoon />;
  }

  return (
    <div className="relative pb-32 lg:pb-0">
      <div className={`mx-auto max-w-7xl py-4 ${currentStep === 3 ? "space-y-10" : "grid grid-cols-1 gap-12 lg:grid-cols-12 items-start"}`}>
        {/* Main Content */}
        <div className={currentStep === 3 ? "w-full" : "lg:col-span-8 space-y-8"}>
          <div className="space-y-6">
            {currentStep === 3 ? (
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                <EventInfoHeader event={event} />
                <div className="hidden md:block">
                   <CountdownTimer onExpire={handleExpire} />
                </div>
              </div>
            ) : (
              <EventInfoHeader event={event} />
            )}
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
                selectedMethodId={selection.methodId}
                onSelect={setMethodId}
              />
            </div>
          )}

          {currentStep === 3 && (
            <OrderConfirmation
              buyerInfo={buyerInfo}
              summary={summary}
              paymentMethod={selectedPaymentMethod}
              onNext={handleNext}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}

          {/* Mobile Specific Sections (Order Summary, Promo, Consent) */}
          {currentStep < 3 && (
            <div className="lg:hidden space-y-8">
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <OrderSummaryCard summary={summary} />
              </div>

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  <Card className="p-6 bg-white border-gray-100 shadow-sm rounded-3xl">
                    <PromoSection />
                    <PaymentConsent
                      agreedToTerms={selection.agreedToTerms}
                      agreedToPrivacy={selection.agreedToPrivacy}
                      onToggleTerms={setAgreedToTerms}
                      onTogglePrivacy={setAgreedToPrivacy}
                      isMethodSelected={!!selection.methodId}
                    />
                  </Card>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && <ImportantGuides />}
        </div>

        {/* Sidebar - Desktop Only (Hidden on Mobile) */}
        {currentStep < 3 && (
          <aside className="lg:col-span-4 lg:sticky lg:top-28 hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700 delay-300 overflow-hidden">
            <div className="space-y-6 pb-12">
              <CheckoutSidebar 
                summary={summary} 
                onNext={handleNext} 
                onBack={handleBack}
                step={currentStep}
                agreedToTerms={selection.agreedToTerms}
                agreedToPrivacy={selection.agreedToPrivacy}
                onToggleTerms={setAgreedToTerms}
                onTogglePrivacy={setAgreedToPrivacy}
                isMethodSelected={!!selection.methodId}
              />
              {currentStep === 1 && <PaymentPartners />}
            </div>
          </aside>
        )}
      </div>

      {/* Sticky Bar - Mobile Only */}
      <CheckoutStickyBar
        summary={summary}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onExpire={handleExpire}
        isLoading={isLoading}
        canSubmit={currentStep === 2 ? isStep2Valid : true}
      />
    </div>
  );
}

function ImportantGuides() {
  return (
    <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
      <h3 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Panduan Penting</h3>
      <ul className="space-y-4">
        {[
          "Pastikan email aktif untuk pengiriman E-Tiket.",
          "Nama harus sesuai kartu identitas (KTP/Passport).",
          "E-Tiket akan dikirim maksimal 15 menit setelah pembayaran."
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
            <p className="text-sm font-bold text-gray-600 leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentPartners() {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-4 grayscale opacity-40">
       <div className="flex items-center gap-1">
         <div className="w-5 h-3 bg-gray-400 rounded-sm" />
         <div className="w-5 h-3 bg-gray-400 rounded-sm" />
         <div className="w-5 h-3 bg-gray-400 rounded-sm" />
       </div>
       <span className="text-[10px] font-bold text-gray-500">PAYMENT PARTNERS</span>
    </div>
  );
}
