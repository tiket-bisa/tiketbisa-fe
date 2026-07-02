import type { PaginationParams } from "~/core/api";


export interface EventFilterParams extends PaginationParams {
  order_by?: string;
  brand_id?: string;
  brand_name?: string;
  // Event lifecycle status: "ONGOING" (active/upcoming) or "ENDED" (past).
  status?: string;
  // Future API filters (tell backend to add these)
  category?: string;
  city?: string;
  time_range?: string;
  price_range?: string;
  search?: string;
}
