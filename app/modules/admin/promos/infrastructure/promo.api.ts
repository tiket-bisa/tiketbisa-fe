import { internalHttpClient } from "~/core/api";

export type PromoType = "PERCENT" | "FLAT";

export interface PromoData {
  id?: string;
  code: string;
  brandId?: string | null;
  type: PromoType;
  value: number;
  maxDiscount?: number | null;
  quota?: number | null;
  usedCount?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  recordFlag?: number;
}

interface PromoListResponse {
  promos: PromoData[];
  totalCount?: number;
  total_count?: number;
}

export const promoAdminApi = {
  async list(): Promise<PromoData[]> {
    const response = await internalHttpClient.get<PromoListResponse>("/promo?limit=100&offset=0&sortBy=created:DESC");
    if (!response.success || !response.data) throw new Error(response.error || "Gagal memuat promo");
    return response.data.promos ?? [];
  },
  create: (data: PromoData) => internalHttpClient.post<PromoData>("/promo", data),
  update: (id: string, data: PromoData) => internalHttpClient.put<PromoData>(`/promo/${id}`, data),
  deactivate: (id: string) => internalHttpClient.delete<null>(`/promo/${id}`),
};
