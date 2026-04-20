import type { PaginationParams } from "~/core/api";


export interface EventFilterParams extends PaginationParams {
  order_by?: string;
  brand_id?: string;
  brand_name?: string;
  // Future API filters (tell backend to add these)
  category?: string;
  city?: string;
  time_range?: string;
  price_range?: string;
  search?: string;
}
