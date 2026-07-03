import { useState, useMemo, useCallback } from "react";
import type { EventTicket } from "~/modules/external/event/domain/event.entity";
import { MAX_TICKETS_PER_ORDER } from "~/modules/external/checkout/domain/checkout.types";

function totalItemsExcluding(quantities: Record<string, number>, excludeId: string): number {
  return Object.entries(quantities).reduce(
    (sum, [id, qty]) => (id === excludeId ? sum : sum + qty),
    0,
  );
}

export function useTicketSelection(tickets: EventTicket[] = []) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const ticketMap = useMemo(() =>
    new Map(tickets.map(t => [t.id, t])),
    [tickets]
  );

  const updateQuantity = useCallback((id: string, qty: number) => {
    const ticket = ticketMap.get(id);
    if (!ticket || !ticket.available) return;

    // Max quantity validation per user/order
    const max = ticket.maxPerOrder ?? 10;
    const requestedQty = Math.max(0, Math.min(qty, max));

    // Defensive UX cap: total tickets across all categories may not exceed
    // MAX_TICKETS_PER_ORDER (backend is authoritative; this just avoids a round-trip).
    setQuantities(prev => {
      const otherCategoriesTotal = totalItemsExcluding(prev, id);
      const remainingRoom = Math.max(0, MAX_TICKETS_PER_ORDER - otherCategoriesTotal);
      const safeQty = Math.min(requestedQty, remainingRoom);

      if (safeQty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: safeQty };
    });
  }, [ticketMap]);

  const selectedTickets = useMemo(() =>
    Object.entries(quantities).map(([id, qty]) => ({
      ticket: ticketMap.get(id)!,
      quantity: qty
    })),
    [quantities, ticketMap]
  );

  const totalPrice = useMemo(() =>
    selectedTickets.reduce((sum, item) => sum + (item.ticket.price * item.quantity), 0),
    [selectedTickets]
  );

  const totalItems = useMemo(() =>
    selectedTickets.reduce((sum, item) => sum + item.quantity, 0),
    [selectedTickets]
  );

  const isAtMaxTickets = totalItems >= MAX_TICKETS_PER_ORDER;

  return {
    quantities,
    updateQuantity,
    totalPrice,
    totalItems,
    selectedTickets,
    isAtMaxTickets,
    maxTicketsPerOrder: MAX_TICKETS_PER_ORDER,
  };
}
