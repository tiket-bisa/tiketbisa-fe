import { internalHttpClient } from "~/core/api/http-client";

export interface DashboardStats {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  totalCheckedIn: number;
  totalTransactions?: number;
  totalBrands?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await internalHttpClient.get<DashboardStats>("/analytics/dashboard-stats");

  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Failed to fetch dashboard stats");
  }

  return response.data;
}
