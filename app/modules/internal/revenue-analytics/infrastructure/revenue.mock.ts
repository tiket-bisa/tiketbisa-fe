import type { RevenueSummary, RevenueDataPoint } from "~/core/types";

export const mockRevenueSummary: RevenueSummary = {
  total_revenue: 2775000,
  total_transactions: 8,
  total_tickets_sold: 20,
  period: "Maret 2026",
};

export const mockRevenueByEvent = [
  { event_name: "Adhyaksa FC vs Persija Jakarta", revenue: 1250000, tickets_sold: 11 },
  { event_name: "Adhyaksa FC vs Arema FC", revenue: 1150000, tickets_sold: 4 },
  { event_name: "Adhyaksa FC vs Persib Bandung", revenue: 375000, tickets_sold: 5 },
];

export const mockRevenueTimeline: RevenueDataPoint[] = [
  { date: "2026-02-27", revenue: 75000, transactions: 1 },
  { date: "2026-02-28", revenue: 225000, transactions: 1 },
  { date: "2026-03-01", revenue: 650000, transactions: 2 },
  { date: "2026-03-02", revenue: 1300000, transactions: 2 },
  { date: "2026-03-03", revenue: 525000, transactions: 2 },
];
