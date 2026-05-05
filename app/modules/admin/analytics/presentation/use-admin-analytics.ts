import { useState, useEffect } from "react";
import { analyticsApi, type RevenueSummary, type RevenueByBrand, type RevenueByEvent, type RevenueTimeline } from "~/modules/internal/analytics/analytics.api";

export function useAdminAnalyticsData() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [revenueByBrand, setRevenueByBrand] = useState<RevenueByBrand[]>([]);
  const [revenueByEvent, setRevenueByEvent] = useState<RevenueByEvent[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<RevenueTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sum, brands, events, timeline] = await Promise.all([
          analyticsApi.getRevenueSummary(),
          analyticsApi.getRevenueByBrand(),
          analyticsApi.getRevenueByEvent(),
          analyticsApi.getRevenueTimeline(),
        ]);
        setSummary(sum);
        setRevenueByBrand(brands);
        
        // Convert to expected UI format
        setRevenueByEvent(events.map(e => ({
          ...e,
          event_name: e.eventName,
          tickets_sold: e.ticketsSold
        })) as any);
        
        setRevenueTimeline(timeline);
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const maxRevenue = Math.max(...revenueTimeline.map((d) => d.revenue), 1);

  return {
    isLoading,
    summary,
    revenueByBrand,
    revenueByEvent,
    revenueTimeline,
    maxRevenue,
  };
}
