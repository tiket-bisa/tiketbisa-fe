import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface DashboardStats {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  totalCheckedIn: number;
  totalTransactions?: number;
  totalBrands?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiFetch<ApiResponse<DashboardStats>>(
    "/internal-tb/analytics/dashboard-stats",
    {
      method: "GET",
    }
  );

  if (!response.success || !response.data) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.data;
}
