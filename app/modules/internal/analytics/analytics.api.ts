import { internalHttpClient } from "~/core/api/http-client";

export interface DashboardStats {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  totalCheckedIn: number;
  totalTransactions?: number;
  totalBrands?: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalTicketsSold: number;
  period: string;
}

export interface RevenueByBrand {
  brandName: string;
  revenue: number;
  transactions: number;
  ticketsSold: number;
}

export interface RevenueByEvent {
  eventName: string;
  brand: string;
  revenue: number;
  ticketsSold: number;
}

export interface RevenueTimeline {
  date: string;
  revenue: number;
  transactions: number;
}

export interface TicketScanningSummary {
  eventId: string;
  eventName: string;
  brandSlug: string;
  totalTickets: number;
  availableTickets: number;
  soldTickets: number;
  checkedInTickets: number;
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await internalHttpClient.get<DashboardStats>("/analytics/dashboard-stats");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch dashboard stats");
    return res.data;
  },

  getRevenueSummary: async (): Promise<RevenueSummary> => {
    const res = await internalHttpClient.get<RevenueSummary>("/analytics/revenue/summary");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue summary");
    return res.data;
  },

  getRevenueByBrand: async (): Promise<RevenueByBrand[]> => {
    const res = await internalHttpClient.get<RevenueByBrand[]>("/analytics/revenue/brands");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue by brand");
    return res.data;
  },

  getRevenueByEvent: async (): Promise<RevenueByEvent[]> => {
    const res = await internalHttpClient.get<RevenueByEvent[]>("/analytics/revenue/events");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue by event");
    return res.data;
  },

  getRevenueTimeline: async (): Promise<RevenueTimeline[]> => {
    const res = await internalHttpClient.get<RevenueTimeline[]>("/analytics/revenue/timeline");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue timeline");
    return res.data;
  },

  getTicketScanningDashboard: async (): Promise<TicketScanningSummary[]> => {
    const res = await internalHttpClient.get<TicketScanningSummary[]>("/analytics/scanning/dashboard");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch scanning dashboard");
    return res.data;
  }
};
