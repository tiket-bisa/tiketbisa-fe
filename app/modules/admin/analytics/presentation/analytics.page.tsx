import { RevenueByBrandCard } from "./components/revenue-by-brand-card";
import { RevenueByEventCard } from "./components/revenue-by-event-card";
import { RevenueSummaryCards } from "./components/revenue-summary-cards";
import { RevenueTimelineCard } from "./components/revenue-timeline-card";
import { useAdminAnalyticsData } from "./use-admin-analytics";

/** Admin — Revenue Analytics (across all brands) */
export default function AdminAnalyticsPage() {
  const { isLoading, summary, revenueByBrand, revenueByEvent, revenueTimeline, maxRevenue } = useAdminAnalyticsData();

  if (isLoading) {
    return <div className="p-8 text-center text-text-tertiary">Memuat analitik...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Analitik Revenue</h1>
        <p className="text-text-tertiary text-sm mt-1">Platform</p>
      </div>

      {summary && <RevenueSummaryCards summary={summary} />}
      <RevenueByBrandCard data={revenueByBrand} />
      <RevenueTimelineCard data={revenueTimeline} maxRevenue={maxRevenue} />
      <RevenueByEventCard data={revenueByEvent} />
    </div>
  );
}
