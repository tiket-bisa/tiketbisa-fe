import type { RevenueSummary, RevenueDataPoint } from "~/core/types";

/** Revenue across all brands — admin view */
export const allRevenueSummary: RevenueSummary = {
  total_revenue: 5675000,
  total_transactions: 15,
  total_tickets_sold: 34,
  period: "Maret 2026",
};

export const allRevenueByBrand = [
  { brand_name: "Adhyaksa FC", revenue: 2775000, transactions: 8, tickets_sold: 20 },
  { brand_name: "Persija Jakarta", revenue: 1350000, transactions: 3, tickets_sold: 6 },
  { brand_name: "Persib Bandung", revenue: 1000000, transactions: 2, tickets_sold: 6 },
  { brand_name: "Bali United", revenue: 550000, transactions: 2, tickets_sold: 3 },
];

export const allRevenueByEvent = [
  { event_name: "Adhyaksa FC vs Persija Jakarta", brand: "Adhyaksa FC", revenue: 1250000, tickets_sold: 11 },
  { event_name: "Adhyaksa FC vs Arema FC", brand: "Adhyaksa FC", revenue: 1150000, tickets_sold: 4 },
  { event_name: "Persija vs Bali United", brand: "Persija Jakarta", revenue: 1350000, tickets_sold: 6 },
  { event_name: "Persib vs Madura United", brand: "Persib Bandung", revenue: 1000000, tickets_sold: 6 },
  { event_name: "Bali United vs PSM Makassar", brand: "Bali United", revenue: 550000, tickets_sold: 3 },
  { event_name: "Adhyaksa FC vs Persib Bandung", brand: "Adhyaksa FC", revenue: 375000, tickets_sold: 5 },
];

export const allRevenueTimeline: RevenueDataPoint[] = [
  { date: "2026-02-27", revenue: 75000, transactions: 1 },
  { date: "2026-02-28", revenue: 225000, transactions: 1 },
  { date: "2026-03-01", revenue: 650000, transactions: 2 },
  { date: "2026-03-02", revenue: 1300000, transactions: 2 },
  { date: "2026-03-03", revenue: 525000, transactions: 2 },
  { date: "2026-03-04", revenue: 1250000, transactions: 2 },
  { date: "2026-03-05", revenue: 1100000, transactions: 3 },
  { date: "2026-03-06", revenue: 550000, transactions: 2 },
];
