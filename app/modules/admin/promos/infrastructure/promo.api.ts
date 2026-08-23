import { ApiRequestError, internalHttpClient, toUserFacingResponseError } from "~/core/api";

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

export type PromoUpsertPayload = Pick<
  PromoData,
  "code" | "brandId" | "type" | "value" | "maxDiscount" | "quota" | "startsAt" | "endsAt"
>;

interface PromoListResponse {
  promos: PromoData[];
  totalCount?: number;
  total_count?: number;
}

export const promoAdminApi = {
  async list(): Promise<PromoData[]> {
    const response = await internalHttpClient.get<PromoListResponse>("/promo?limit=100&offset=0&sortBy=created:DESC");
    if (!response.success || !response.data) {
      throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memuat promo."));
    }
    return response.data.promos ?? [];
  },
  create: (data: PromoUpsertPayload) => internalHttpClient.post<PromoData>("/promo", data),
  update: (id: string, data: PromoUpsertPayload) => internalHttpClient.put<PromoData>(`/promo/${id}`, data),
  deactivate: (id: string) => internalHttpClient.delete<null>(`/promo/${id}`),
};
