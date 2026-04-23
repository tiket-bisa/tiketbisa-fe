import { RevenueByBrandCard } from "./components/revenue-by-brand-card";
import { RevenueByEventCard } from "./components/revenue-by-event-card";
import { RevenueSummaryCards } from "./components/revenue-summary-cards";
import { RevenueTimelineCard } from "./components/revenue-timeline-card";
import { TicketsByCategoryCard } from "./components/tickets-by-category-card";

/** Admin — Revenue Analytics (across all brands) */
export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Analitik Revenue</h1>
        <p className="text-text-tertiary text-sm mt-1">Platform</p>
      </div>

      <RevenueSummaryCards />
      <RevenueByBrandCard />
      <RevenueTimelineCard />
      <TicketsByCategoryCard />
      <RevenueByEventCard />
    </div>
  );
}
