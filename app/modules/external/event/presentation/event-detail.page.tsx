import { useNavigate, useSearchParams } from "react-router";
import { StickyPriceBar } from "~/shared/components";
import { useTicketSelection } from "~/shared/hooks/use-ticket-selection";
import { eventApi } from "../infrastructure/event.api";

import { EventDetailHeader } from "./components/event-detail-header";
import { EventDetailSidebar } from "./components/event-detail-sidebar";
import { EventDetailTabs } from "./components/event-detail-tabs";

import type { Route } from "./+types/event-detail.page";

export async function loader({ params }: Route.LoaderArgs) {
  const event = await eventApi.getEventById(params.eventId);
  if (!event) throw new Response("Not Found", { status: 404 });
  return { event };
}

export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-surface-primary animate-pulse">
      <div className="h-[400px] bg-surface-alt" />
      <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 w-64 bg-surface-alt rounded" />
          <div className="h-[400px] bg-surface-alt rounded-xl" />
        </div>
        <div className="h-[300px] bg-surface-alt rounded-xl" />
      </div>
    </div>
  );
}

export default function EventDetailPage({ loaderData }: Route.ComponentProps) {
  const { event } = loaderData;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Logic & State Hooks
  const activeTab = searchParams.get("tab") || "deskripsi";
  const { quantities, updateQuantity, totalPrice } = useTicketSelection(event.tickets);

  const handleTabChange = (val: string) => {
    setSearchParams(prev => {
      prev.set("tab", val);
      return prev;
    }, { replace: true });
  };

  const handleCheckout = () => {
    navigate(`/checkout/${event.id}`);
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24" data-theme="dark">
      <EventDetailHeader event={event} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <EventDetailTabs 
            event={event} 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            quantities={quantities}
            onQuantityChange={updateQuantity}
          />
          <EventDetailSidebar 
            event={event} 
            totalPrice={totalPrice}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <StickyPriceBar
          totalPrice={totalPrice}
          onCheckout={handleCheckout}
          disabled={totalPrice <= 0}
        />
      </div>
    </div>
  );
}
