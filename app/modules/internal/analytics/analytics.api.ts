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
  getDashboardStats: async (brandId?: string): Promise<DashboardStats> => {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const res = await internalHttpClient.get<DashboardStats>(`/analytics/dashboard/stats${query}`);
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch dashboard stats");
    return res.data;
  },

  getRevenueSummary: async (brandId?: string): Promise<RevenueSummary> => {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const res = await internalHttpClient.get<RevenueSummary>(`/analytics/revenue/summary${query}`);
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue summary");
    return res.data;
  },

  getRevenueByBrand: async (): Promise<RevenueByBrand[]> => {
    const res = await internalHttpClient.get<RevenueByBrand[]>("/analytics/revenue/brands");
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue by brand");
    return res.data;
  },

  getRevenueByEvent: async (brandId?: string): Promise<RevenueByEvent[]> => {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const res = await internalHttpClient.get<RevenueByEvent[]>(`/analytics/revenue/events${query}`);
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue by event");
    return res.data;
  },

  getRevenueTimeline: async (brandId?: string): Promise<RevenueTimeline[]> => {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const res = await internalHttpClient.get<RevenueTimeline[]>(`/analytics/revenue/timeline${query}`);
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch revenue timeline");
    return res.data;
  },

  getTicketScanningDashboard: async (brandId?: string): Promise<TicketScanningSummary[]> => {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const res = await internalHttpClient.get<TicketScanningSummary[]>(`/analytics/scanning/dashboard${query}`);
    if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch scanning dashboard");
    return res.data;
  }
};
