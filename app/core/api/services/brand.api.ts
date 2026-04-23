import { httpClient } from "../http-client";
import type { ApiResponse } from "../api-response.type";

/* ── BE data shapes (snake_case from Java @JsonNaming) ── */

export interface BrandApiData {
    id: string;
    name: string;
    logo_path: string | null;
    banner_path: string | null;
    description: string | null;
    created: string | null;
    create_by: string | null;
    last_updated: string | null;
    last_update_by: string | null;
}

export interface BrandListResponse {
    brands: BrandApiData[];
    total_count: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface BrandListParams {
    limit?: number;
    offset?: number;
    name?: string;
}

/* ── API functions ── */

function buildQuery(params?: BrandListParams): string {
    if (!params) return "";
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    if (params.name) qs.set("name", params.name);
    const str = qs.toString();
    return str ? `?${str}` : "";
}

export const brandApi = {
    getList: (params?: BrandListParams) =>
        httpClient.get<BrandListResponse>(`/brand${buildQuery(params)}`),

    getById: (id: string) =>
        httpClient.get<BrandApiData>(`/brand/${id}`),

    create: (data: Partial<BrandApiData>, createBy: string) =>
        httpClient.post<BrandApiData>("/brand", {
            ...data,
            headers: { "X-TB-Identifier": createBy },
        }),

    update: (id: string, data: Partial<BrandApiData>, updateBy: string) =>
        httpClient.put<BrandApiData>(`/brand/${id}`, {
            ...data,
            headers: { "X-TB-Identifier": updateBy },
        }),

    delete: (id: string) =>
        httpClient.delete<null>(`/brand/${id}`),
};

/* ── Mapper: BE → FE type ── */

import type { Brand } from "~/core/types";

export function mapBrandApiToFe(api: BrandApiData): Brand {
    return {
        id: api.id,
        name: api.name,
        logo_url: api.logo_path ?? "/logo/tiketbisa-white.png",
        slug: api.name.toLowerCase().replace(/\s+/g, "-"),
        description: api.description ?? undefined,
    };
}
