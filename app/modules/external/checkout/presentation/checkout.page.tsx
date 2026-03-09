import { useSearchParams } from "react-router";
import { OrderDetailsForm } from "./components/order-details-form";
import { CheckoutSidebar } from "./components/checkout-sidebar";
import { EventInfoHeader } from "./components/event-info-header";
import { CheckoutComingSoon } from "./components/checkout-coming-soon";
import { PaymentMethodSelection } from "./components/payment-method-selection";
import { OrderConfirmation } from "./components/order-confirmation";
import { CountdownTimer } from "./components/countdown-timer";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);

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

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validate()) {
        setSearchParams({ ...Object.fromEntries(searchParams), step: "2" });
      }
    } else if (currentStep === 2) {
      if (selection.methodId && selection.agreedToTerms && selection.agreedToPrivacy) {
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

  // Step 4+ View 
  if (currentStep > 3) {
    return <CheckoutComingSoon />;
  }

  // Step 3: Full Width Layout (No Sidebar Grid)
  if (currentStep === 3) {
    return (
      <div className="max-w-7xl mx-auto py-4 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <EventInfoHeader event={event} />
          <div className="w-full md:w-auto">
             <CountdownTimer />
          </div>
        </div>

        <OrderConfirmation
          buyerInfo={buyerInfo}
          summary={summary}
          paymentMethod={selectedPaymentMethod}
          onNext={handleNext}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start max-w-7xl mx-auto py-4">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-8">
        <EventInfoHeader event={event} />

        {currentStep === 1 && (
          <>
            <OrderDetailsForm 
              data={buyerInfo} 
              errors={errors}
              onChange={handleInputChange} 
              className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
            />
            <ImportantGuides />
          </>
        )}

        {currentStep === 2 && (
          <PaymentMethodSelection
            methods={paymentMethods}
            selectedMethodId={selection.methodId}
            onSelect={setMethodId}
            className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
          />
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 lg:sticky lg:top-28 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
        <div className="space-y-6">
          <CheckoutSidebar 
            summary={summary} 
            onNext={handleNext} 
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
