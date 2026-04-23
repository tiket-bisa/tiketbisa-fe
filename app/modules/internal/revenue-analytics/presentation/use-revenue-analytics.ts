import { useMemo } from "react";
import { mockTransactions } from "../../dashboard/infrastructure/transaction.mock";
import { mockEvents } from "../../events/infrastructure/event.mock";

export function useRevenueAnalyticsData(brandSlug?: string) {
  const brandTransactions = useMemo(
    () => mockTransactions.filter((t) => t.brand_slug === brandSlug),
    [brandSlug],
  );

  const brandEvents = useMemo(
    () => mockEvents.filter((e) => e.brand_slug === brandSlug),
    [brandSlug],
  );

  const paidTransactions = useMemo(
    () => brandTransactions.filter((t) => t.status === "paid"),
    [brandTransactions],
  );

  const totalRevenue = useMemo(
    () => paidTransactions.reduce((s, t) => s + t.total_price, 0),
    [paidTransactions],
  );

  const totalTicketsSold = useMemo(
    () => paidTransactions.reduce((s, t) => s + t.quantity, 0),
    [paidTransactions],
  );

  const revenueByEvent = useMemo(() => {
    const map: Record<string, { event_name: string; revenue: number; tickets_sold: number }> = {};
    for (const tx of paidTransactions) {
      if (!map[tx.event_id]) {
        map[tx.event_id] = { event_name: tx.event_name, revenue: 0, tickets_sold: 0 };
      }
      map[tx.event_id].revenue += tx.total_price;
      map[tx.event_id].tickets_sold += tx.quantity;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidTransactions]);

  const ticketsByCategory = useMemo(() => {
    const map: Record<string, { category: string; quantity: number; revenue: number }> = {};
    for (const tx of paidTransactions) {
      if (!map[tx.ticket_name]) {
        map[tx.ticket_name] = { category: tx.ticket_name, quantity: 0, revenue: 0 };
      }
      map[tx.ticket_name].quantity += tx.quantity;
      map[tx.ticket_name].revenue += tx.total_price;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidTransactions]);

  const revenueTimeline = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; transactions: number }> = {};
    for (const tx of paidTransactions) {
      if (!tx.created_at) continue;
      const date = tx.created_at.slice(0, 10);
      if (!map[date]) {
        map[date] = { date, revenue: 0, transactions: 0 };
      }
      map[date].revenue += tx.total_price;
      map[date].transactions += 1;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [paidTransactions]);

  const maxRevenue = useMemo(
    () => Math.max(...revenueTimeline.map((d) => d.revenue), 1),
    [revenueTimeline],
  );

  return {
    brandTransactions,
    brandEvents,
    paidTransactions,
    totalRevenue,
    totalTicketsSold,
    revenueByEvent,
    ticketsByCategory,
    revenueTimeline,
    maxRevenue,
  };
}
