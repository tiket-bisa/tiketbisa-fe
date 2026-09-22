import { useState, useMemo, useCallback } from "react";
import type { EventTicket } from "~/modules/external/event/domain/event.entity";
import { MAX_TICKETS_PER_TRANSACTION } from "../constants/transaction";

export function useTicketSelection(tickets: EventTicket[] = []) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const ticketMap = useMemo(() =>
    new Map(tickets.map(t => [t.id, t])),
    [tickets]
  );

  const updateQuantity = useCallback((id: string, qty: number) => {
    const ticket = ticketMap.get(id);
    if (!ticket || !ticket.available) return;

    setQuantities(prev => {
      const currentQty = prev[id] ?? 0;
      const totalSelected = Object.entries(prev).reduce((sum, [ticketId, value]) =>
        sum + value * (ticketMap.get(ticketId)?.bundleSize ?? 1), 0);
      const bundleSize = ticket.bundleSize ?? 1;
      const remainingSlots = MAX_TICKETS_PER_TRANSACTION - (totalSelected - currentQty * bundleSize);
      const perTicketMax = ticket.maxPerOrder ?? MAX_TICKETS_PER_TRANSACTION;
      const stock = ticket.remaining ?? Infinity;
      const transactionMax = Math.floor(remainingSlots / bundleSize);
      const maxAllowed = Math.max(0, Math.min(perTicketMax, transactionMax, stock));
      const safeQty = Math.max(0, Math.min(qty, maxAllowed));

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
    selectedTickets.reduce((sum, item) => sum + item.quantity * (item.ticket.bundleSize ?? 1), 0),
    [selectedTickets]
  );

  const isAtMaxTickets = totalItems >= MAX_TICKETS_PER_TRANSACTION;

  return {
    quantities,
    updateQuantity,
    totalPrice,
    totalItems,
    selectedTickets,
    isAtMaxTickets,
    maxTicketsPerTransaction: MAX_TICKETS_PER_TRANSACTION,
  };
}
