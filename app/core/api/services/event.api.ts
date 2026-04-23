import { httpClient } from "../http-client";

/* ── BE data shapes ── */

export interface EventApiData {
    id: string;
    brand_id: string;
    name: string;
    banner_path: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    term_and_condition: string | null;
    venue: string | null;
    location: string | null;
    city: string | null;
    status: "ONGOING" | "ENDED" | null;
    is_published: boolean | null;
    created: string | null;
}

export interface EventListResponse {
    events: EventApiData[];
    total_count: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface EventListParams {
    limit?: number;
    offset?: number;
    brandId?: string;
    name?: string;
    status?: string;
    isPublished?: boolean;
    city?: string;
}

/* ── API functions ── */

function buildQuery(params?: EventListParams): string {
    if (!params) return "";
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    if (params.brandId) qs.set("brandId", params.brandId);
    if (params.name) qs.set("name", params.name);
    if (params.status) qs.set("status", params.status);
    if (params.isPublished != null) qs.set("isPublished", String(params.isPublished));
    if (params.city) qs.set("city", params.city);
    const str = qs.toString();
    return str ? `?${str}` : "";
}

export const eventApi = {
    getList: (params?: EventListParams) =>
        httpClient.get<EventListResponse>(`/event${buildQuery(params)}`),

    getById: (id: string) =>
        httpClient.get<EventApiData>(`/event/${id}`),

    create: (data: Partial<EventApiData>) =>
        httpClient.post<EventApiData>("/event", data),

    update: (id: string, data: Partial<EventApiData>) =>
        httpClient.put<EventApiData>(`/event/${id}`, data),

    delete: (id: string) =>
        httpClient.delete<null>(`/event/${id}`),
};

/* ── Mapper: BE → FE type ── */

import type { EventSummary } from "~/core/types";

/**
 * Maps BE EventData → FE EventSummary.
 * @param brandName  Brand name to attach (BE only stores brandId).
 * @param brandSlug  Derived slug for partner filtering.
 */
export function mapEventApiToFe(
    api: EventApiData,
    brandName: string = "",
    brandSlug: string = "",
): EventSummary {
    // Map BE status → FE status
    let feStatus: EventSummary["status"] = "draft";
    if (api.is_published && api.status === "ONGOING") feStatus = "published";
    else if (api.status === "ENDED") feStatus = "completed";
    else if (!api.is_published) feStatus = "draft";

    // Format date
    const date = api.start_date
        ? new Date(api.start_date).toISOString().slice(0, 10)
        : "";

    // Format time
    let time: string | undefined;
    if (api.start_date) {
        const d = new Date(api.start_date);
        time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`;
    }

    return {
        id: api.id,
        name: api.name,
        brand: brandName,
        brand_slug: brandSlug,
        description: api.description ?? "",
        date,
        location: api.venue ?? api.location ?? undefined,
        time,
        status: feStatus,
    };
}
