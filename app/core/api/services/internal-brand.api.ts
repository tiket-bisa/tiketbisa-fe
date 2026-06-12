import { internalHttpClient } from "../http-client";
import type { Brand } from "~/core/types";

export interface InternalBrandApiData {
  id: string;
  name: string;
  logoPath?: string | null;
  bannerPath?: string | null;
  description?: string | null;
  created?: string | null;
  createBy?: string | null;
  lastUpdated?: string | null;
  lastUpdateBy?: string | null;
}

export interface InternalBrandListResponse {
  brands: InternalBrandApiData[];
  totalCount?: number;
  limit?: number;
  offset?: number;
  totalPages?: number;
  currentPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface InternalBrandListParams {
  limit?: number;
  offset?: number;
  name?: string;
}

export interface BrandImageUploadResponse {
  imageUrl: string;
}

export interface SponsorData {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
}

interface SponsorApiData extends Record<string, unknown> {
  id?: string;
  name?: string;
  imageUrl?: string;
  image_url?: string;
  sortOrder?: number;
  sort_order?: number;
}

export interface SponsorListResponse {
  sponsors: SponsorApiData[];
}

export interface SponsorCreateUpdateRequest {
  name: string;
  imageUrl: string;
  sortOrder?: number;
}

function buildQuery(params?: InternalBrandListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.name) qs.set("name", params.name);
  const str = qs.toString();
  return str ? `?${str}` : "";
}

function normalizeBrand(api: InternalBrandApiData & Record<string, unknown>): InternalBrandApiData {
  return {
    id: String(api.id ?? ""),
    name: String(api.name ?? ""),
    logoPath: (api.logoPath ?? api.logo_path ?? null) as string | null,
    bannerPath: (api.bannerPath ?? api.banner_path ?? null) as string | null,
    description: (api.description ?? null) as string | null,
    created: (api.created ?? null) as string | null,
    createBy: (api.createBy ?? api.create_by ?? null) as string | null,
    lastUpdated: (api.lastUpdated ?? api.last_updated ?? null) as string | null,
    lastUpdateBy: (api.lastUpdateBy ?? api.last_update_by ?? null) as string | null,
  };
}

function normalizeSponsor(api: SponsorApiData): SponsorData {
  return {
    id: String(api.id ?? ""),
    name: String(api.name ?? ""),
    imageUrl: String(api.imageUrl ?? api.image_url ?? ""),
    sortOrder: Number(api.sortOrder ?? api.sort_order ?? 0),
  };
}

function normalizeSponsorListResponse(response: Awaited<ReturnType<typeof internalHttpClient.get<SponsorListResponse>>>) {
  return {
    ...response,
    data: response.data
      ? { sponsors: (response.data.sponsors ?? []).map(normalizeSponsor) }
      : response.data,
  };
}

export const internalBrandApi = {
  getList: (params?: InternalBrandListParams) =>
    internalHttpClient.get<InternalBrandListResponse>(`/brand${buildQuery(params)}`),

  getById: (id: string) =>
    internalHttpClient.get<InternalBrandApiData>(`/brand/${id}`),

  create: (data: Partial<InternalBrandApiData>) =>
    internalHttpClient.post<InternalBrandApiData>("/brand", data),

  update: (id: string, data: Partial<InternalBrandApiData>) =>
    internalHttpClient.put<InternalBrandApiData>(`/brand/${id}`, data),

  delete: (id: string) =>
    internalHttpClient.delete<null>(`/brand/${id}`),

  uploadImage: (data: {
    imageBase64: string;
    imageMimeType: string;
    imageFileName: string;
    imageKind: "LOGO" | "BANNER" | "SPONSOR";
  }) =>
    internalHttpClient.post<BrandImageUploadResponse>("/brand/image/upload", data),

  getSponsors: async (brandId: string) => {
    const response = await internalHttpClient.get<SponsorListResponse>(`/brand/${brandId}/sponsors`);
    return normalizeSponsorListResponse(response);
  },

  addSponsor: (brandId: string, data: SponsorCreateUpdateRequest) =>
    internalHttpClient.post<SponsorData>(`/brand/${brandId}/sponsors`, data),

  updateSponsor: (brandId: string, sponsorId: string, data: SponsorCreateUpdateRequest) =>
    internalHttpClient.put<SponsorData>(`/brand/${brandId}/sponsors/${sponsorId}`, data),

  reorderSponsors: async (
    brandId: string,
    data: { sponsors: { id: string; sortOrder: number }[] },
  ) => {
    const response = await internalHttpClient.put<SponsorListResponse>(`/brand/${brandId}/sponsors/reorder`, data);
    return normalizeSponsorListResponse(response);
  },

  deleteSponsor: (brandId: string, sponsorId: string) =>
    internalHttpClient.delete<null>(`/brand/${brandId}/sponsors/${sponsorId}`),

  copySponsorsToEvent: async (brandId: string, eventId: string) => {
    const response = await internalHttpClient.post<SponsorListResponse>(
      `/brand/${brandId}/sponsors/copy-to-event/${eventId}`,
      {},
    );
    return normalizeSponsorListResponse(response);
  },
};

export function mapInternalBrandToFe(api: InternalBrandApiData): Brand {
  const normalized = normalizeBrand(api as InternalBrandApiData & Record<string, unknown>);
  const slug = normalized.name.toLowerCase().replace(/\s+/g, "-");
  return {
    id: normalized.id,
    name: normalized.name,
    slug,
    logo_url: normalized.logoPath ?? "/logo/tiketbisa-white.png",
    description: normalized.description ?? undefined,
  };
}

export function normalizeInternalBrand(api: InternalBrandApiData): InternalBrandApiData {
  return normalizeBrand(api as InternalBrandApiData & Record<string, unknown>);
}
