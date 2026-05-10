import { apiFetch } from "~/core/api";
import type { PaginatedApiResponse, ApiResponse } from "~/core/api";
import type { BrandFilterParams } from "./brand-filter.params";
import type { Brand } from "../domain/brand.entity";
import type { BrandDto } from "./brand.dto";
import { mapBrandDtoToEntity } from "./brand.mapper";

interface BrandListResponseData {
  limit: number;
  offset: number;
  totalCount: number;
  brands: BrandDto[];
}

export const brandApi = {
  getBrands: async (params: BrandFilterParams): Promise<PaginatedApiResponse<Brand>> => {
    const queryParams = new URLSearchParams();

    if (params.category) queryParams.append("name", params.category);
    else if (params.location) queryParams.append("name", params.location);

    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params.order_by) queryParams.append("orderBy", params.order_by);

    const response = await apiFetch<ApiResponse<BrandListResponseData>>(
      `/brand?${queryParams.toString()}`,
    );

    return {
      ...response,
      data: {
        limit: response.data.limit,
        offset: response.data.offset,
        count: response.data.totalCount,
        brand_list: (response.data.brands || []).map(mapBrandDtoToEntity),
      },
    };
  },

  getBrandBySlug: async (slug: string): Promise<Brand | null> => {
    try {
      const response = await apiFetch<ApiResponse<BrandDto>>(`/brand/${slug}`);
      if (!response.data) return null;
      return mapBrandDtoToEntity(response.data);
    } catch (e) {
      console.error("Failed to fetch brand by slug/id", e);
      return null;
    }
  },
};
