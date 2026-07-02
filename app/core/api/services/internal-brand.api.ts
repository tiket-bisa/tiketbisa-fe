import { internalHttpClient } from "../http-client";
import type { Brand } from "~/core/types";

export interface InternalBrandApiData {
  id: string;
  name: string;
  logoPath?: string | null;
  bannerPath?: string | null;
  description?: string | null;
  adminFee?: number | null;
  category?: string | null;
  subCategory?: string | null;
  sponsorPath?: string | null;
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
    adminFee: api.adminFee != null || api.admin_fee != null
      ? Number(api.adminFee ?? api.admin_fee) || 0
      : null,
    category: (api.category ?? null) as string | null,
    subCategory: (api.subCategory ?? api.sub_category ?? null) as string | null,
    sponsorPath: (api.sponsorPath ?? api.sponsor_path ?? null) as string | null,
    created: (api.created ?? null) as string | null,
    createBy: (api.createBy ?? api.create_by ?? null) as string | null,
    lastUpdated: (api.lastUpdated ?? api.last_updated ?? null) as string | null,
    lastUpdateBy: (api.lastUpdateBy ?? api.last_update_by ?? null) as string | null,
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
    imageKind: "LOGO" | "BANNER";
  }) =>
    internalHttpClient.post<BrandImageUploadResponse>("/brand/image/upload", data),
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
