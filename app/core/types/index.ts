/**
 * Tiketbisa — Shared Domain Entities
 */

/** Brand / Institution */
export interface Brand {
  id: string;
  name: string;
  logo_url: string;
  slug: string;
  description?: string;
}

/** Event summary (list item) */
export interface EventSummary {
  id: string;
  name: string;
  brand: string;
  brand_slug?: string;
  description: string;
  image_url?: string;
  date: string;
  location?: string;
  time?: string;
  status?: "draft" | "published" | "completed" | "cancelled";
}

/** Ticket */
export interface Ticket {
  id: string;
  event_id: string;
  name: string;
  price: number;
  available: number;
  sold: number;
  checked_in: number;
  max_per_order?: number;
}

/** Transaction / Order */
export interface Transaction {
  id: string;
  event_id: string;
  event_name: string;
  brand_slug?: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  ticket_name: string;
  quantity: number;
  total_price: number;
  status: "pending" | "paid" | "cancelled" | "refunded";
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

/** Revenue Summary */
export interface RevenueSummary {
  total_revenue: number;
  total_transactions: number;
  total_tickets_sold: number;
  period: string;
}

/** Revenue data point for charts */
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  transactions: number;
}

/** Ticket Scan Result */
export interface TicketScanResult {
  ticket_id: string;
  event_name?: string;
  ticket_name?: string;
  buyer_name?: string;
  status: "valid" | "already_checked_in" | "invalid" | "expired";
  checked_in_at?: string;
  message?: string;
}

/** Ticket dashboard summary */
export interface TicketDashboardSummary {
  event_id: string;
  event_name: string;
  brand_slug?: string;
  total_tickets: number;
  available_tickets: number;
  checked_in_tickets: number;
  sold_tickets: number;
}
