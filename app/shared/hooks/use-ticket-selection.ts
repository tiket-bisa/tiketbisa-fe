import { useState, useMemo, useCallback } from "react";
import type { EventTicket } from "~/modules/external/event/domain/event.entity";

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
    const safeQty = Math.max(0, Math.min(qty, max));

    setQuantities(prev => {
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

  return {
    quantities,
    updateQuantity,
    totalPrice,
    totalItems,
    selectedTickets
  };
}
