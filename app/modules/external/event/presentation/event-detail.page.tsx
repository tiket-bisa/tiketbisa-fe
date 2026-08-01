import { StickyPriceBar } from "~/shared/components";
import { useToast } from "~/core/design-system/components";
import { MAX_TICKETS_PER_TRANSACTION } from "~/shared/constants/transaction";
import { useTicketSelection } from "~/shared/hooks/use-ticket-selection";
import { eventApi } from "../infrastructure/event.api";

import { EventDetailHeader } from "./components/event-detail-header";
import { EventDetailSidebar } from "./components/event-detail-sidebar";
import { EventDetailContent } from "./components/event-detail-content";

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

  // Logic & State Hooks
  const { quantities, updateQuantity, totalPrice, totalItems } = useTicketSelection(event.tickets);
  const { warning: warningToast } = useToast();

  const handleCheckout = () => {
    if (totalItems > MAX_TICKETS_PER_TRANSACTION) {
      warningToast(`Maksimum ${MAX_TICKETS_PER_TRANSACTION} tiket per transaksi.`);
      return;
    }

    sessionStorage.removeItem("tiketbisa_checkout_deadline");
    sessionStorage.removeItem("tiketbisa_buyer_info");
    sessionStorage.removeItem("tiketbisa_payment_selection");
    sessionStorage.removeItem("tiketbisa_checkout_summary");

    const params = new URLSearchParams();
    params.set("step", "1");
    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty > 0) {
        params.set(`t[${ticketId}]`, String(qty));
      }
    });

    window.location.assign(`/checkout/${event.id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24 lg:pb-8" data-theme="dark">
      <EventDetailHeader event={event} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <EventDetailContent event={event} />
          <EventDetailSidebar
            event={event}
            totalPrice={totalPrice}
            totalItems={totalItems}
            onCheckout={handleCheckout}
            quantities={quantities}
            onQuantityChange={updateQuantity}
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
