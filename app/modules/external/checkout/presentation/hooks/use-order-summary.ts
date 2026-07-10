import { useMemo } from "react";
import type { OrderSummary, OrderItem } from "../../domain/checkout.types";
import type { Event } from "../../../event/domain/event.entity";
import { buildBaseOrderSummary } from "../../domain/checkout.pricing";

export function useOrderSummary(event: Event, searchParams: URLSearchParams) {
  const summary = useMemo<OrderSummary>(() => {
    const items: OrderItem[] = [];

    for (const [key, value] of searchParams.entries()) {
      const match = key.match(/^t\[(.+)\]$/);
      if (match) {
        const ticketId = match[1];
        const quantity = parseInt(value, 10);
        const ticket = event.tickets.find((t) => t.id === ticketId);

        if (ticket && quantity > 0) {
          items.push({
            ticketId: ticket.id,
            ticketName: ticket.name,
            price: ticket.price,
            quantity: quantity,
          });
        }
      }
    }

    return buildBaseOrderSummary(event, items);
  }, [event.tickets, searchParams]);

  return summary;
}
