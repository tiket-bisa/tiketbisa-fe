import type { PaginationParams } from "~/core/api/pagination.type";

export interface BrandFilterParams extends Partial<PaginationParams> {
  order_by?: string;
  category?: string;
  location?: string;
}
