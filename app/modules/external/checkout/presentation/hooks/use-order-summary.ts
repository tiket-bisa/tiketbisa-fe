import { useMemo } from "react";
import type { OrderSummary, OrderItem } from "../../domain/checkout.types";
import type { Event } from "../../../event/domain/event.entity";

export function useOrderSummary(event: Event, searchParams: URLSearchParams) {
  const summary = useMemo<OrderSummary>(() => {
    const items: OrderItem[] = [];
    let subtotal = 0;

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
          subtotal += ticket.price * quantity;
        }
      }
    }

    const tax = subtotal * 0.1;
    const serviceFee = subtotal > 0 ? 10000 : 0; 
    const adminFee = subtotal > 0 ? 5000 : 0;

    return {
      subtotal,
      adminFee,
      serviceFee,
      tax,
      totalPrice: subtotal + adminFee + serviceFee + tax,
      items,
    };
  }, [event.tickets, searchParams]);

  if (typeof window !== "undefined") {
    sessionStorage.setItem("tiketbisa_checkout_summary", JSON.stringify(summary));
  }

  return summary;
}
