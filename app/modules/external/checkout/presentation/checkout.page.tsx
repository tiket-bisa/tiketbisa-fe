import { useSearchParams } from "react-router";
import { OrderDetailsForm } from "./components/order-details-form";
import { CheckoutSidebar } from "./components/checkout-sidebar";
import { EventInfoHeader } from "./components/event-info-header";
import { CheckoutComingSoon } from "./components/checkout-coming-soon";
import { useOrderSummary } from "./hooks/use-order-summary";
import { useCheckoutForm } from "./hooks/use-checkout-form";
import { eventApi } from "../../event/infrastructure/event.api";
import type { Route } from "./+types/checkout.page";

export async function loader({ params }: Route.LoaderArgs) {
  const event = await eventApi.getEventById(params.eventId);
  if (!event) throw new Response("Not Found", { status: 404 });
  return { event };
}

export default function CheckoutPage({ loaderData }: Route.ComponentProps) {
  const { event } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);

  // Clean Logic using hooks
  const summary = useOrderSummary(event, searchParams);
  const { buyerInfo, errors, validate, handleInputChange } = useCheckoutForm();

  const handleNext = () => {
    if (validate()) {
      setSearchParams({ step: (currentStep + 1).toString() });
    }
  };

  // Step 2+ View 
  if (currentStep !== 1) {
    return <CheckoutComingSoon />;
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start max-w-7xl mx-auto py-4">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-8">
        <EventInfoHeader event={event} />

        <OrderDetailsForm 
          data={buyerInfo} 
          errors={errors}
          onChange={handleInputChange} 
          className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
        />
        
        <ImportantGuides />
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 lg:sticky lg:top-28 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
        <CheckoutSidebar 
          summary={summary} 
          onNext={handleNext} 
        />
        
        <PaymentPartners />
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
