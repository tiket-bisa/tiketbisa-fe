import { useState, useEffect } from "react";
import { analyticsApi, type RevenueSummary, type RevenueByEvent, type RevenueTimeline } from "../../analytics/analytics.api";
import { transactionApi } from "~/core/api/services/transaction.api";

export function useRevenueAnalyticsData(brandId?: string) {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [revenueByEvent, setRevenueByEvent] = useState<RevenueByEvent[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<RevenueTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [summary, events, timeline, txRes] = await Promise.all([
          analyticsApi.getRevenueSummary(brandId),
          analyticsApi.getRevenueByEvent(brandId),
          analyticsApi.getRevenueTimeline(brandId),
          transactionApi.getList({ limit: 1000, brandId })
        ]);
        
        setTotalRevenue(summary.totalRevenue);
        setTotalTicketsSold(summary.totalTicketsSold);
        setTotalTransactions(summary.totalTransactions);
        
        // Convert to camelCase/snake_case as expected by UI
        setRevenueByEvent(events.map(e => ({
          ...e,
          event_name: e.eventName,
          tickets_sold: e.ticketsSold
        })) as any);
        
        setRevenueTimeline(timeline);
      } catch (err) {
        console.error("Failed to load revenue analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [brandId]);

  const maxRevenue = Math.max(...revenueTimeline.map((d) => d.revenue), 1);

  return {
    isLoading,
    totalTransactions,
    totalRevenue,
    totalTicketsSold,
    revenueByEvent,
    revenueTimeline,
    maxRevenue,
  };
}
