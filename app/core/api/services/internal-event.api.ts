import { internalHttpClient } from "../http-client";
import type { EventSummary } from "~/core/types";

export interface InternalEventApiData {
  id: string;
  brandId: string;
  name: string;
  bannerPath?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  termAndCondition?: string | null;
  venue?: string | null;
  location?: string | null;
  city?: string | null;
  status?: "ONGOING" | "ENDED" | null;
  isPublished?: boolean | null;
  created?: string | null;
}

export interface InternalEventListResponse {
  events: InternalEventApiData[];
  totalCount?: number;
  limit?: number;
  offset?: number;
  totalPages?: number;
  currentPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface InternalEventListParams {
  limit?: number;
  offset?: number;
  brandId?: string;
  name?: string;
  status?: string;
  isPublished?: boolean;
  city?: string;
  sortBy?: string;
}

function buildQuery(params?: InternalEventListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.brandId) qs.set("brandId", params.brandId);
  if (params.name) qs.set("name", params.name);
  if (params.status) qs.set("status", params.status);
  if (params.isPublished != null) qs.set("isPublished", String(params.isPublished));
  if (params.city) qs.set("city", params.city);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  const str = qs.toString();
  return str ? `?${str}` : "";
}

function normalizeEvent(api: InternalEventApiData & Record<string, unknown>): InternalEventApiData {
  return {
    id: String(api.id ?? ""),
    brandId: String(api.brandId ?? api.brand_id ?? ""),
    name: String(api.name ?? ""),
    bannerPath: (api.bannerPath ?? api.banner_path ?? null) as string | null,
    startDate: (api.startDate ?? api.start_date ?? null) as string | null,
    endDate: (api.endDate ?? api.end_date ?? null) as string | null,
    description: (api.description ?? null) as string | null,
    termAndCondition: (api.termAndCondition ?? api.term_and_condition ?? null) as string | null,
    venue: (api.venue ?? null) as string | null,
    location: (api.location ?? null) as string | null,
    city: (api.city ?? null) as string | null,
    status: (api.status ?? null) as InternalEventApiData["status"],
    isPublished: (api.isPublished ?? api.is_published ?? null) as boolean | null,
    created: (api.created ?? null) as string | null,
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} WIB`;
}

export const internalEventApi = {
  getList: (params?: InternalEventListParams) =>
    internalHttpClient.get<InternalEventListResponse>(`/event${buildQuery(params)}`),

  getById: (id: string) =>
    internalHttpClient.get<InternalEventApiData>(`/event/${id}`),

  create: (data: Partial<InternalEventApiData>) =>
    internalHttpClient.post<InternalEventApiData>("/event", data),

  update: (id: string, data: Partial<InternalEventApiData>) =>
    internalHttpClient.put<InternalEventApiData>(`/event/${id}`, data),

  delete: (id: string) =>
    internalHttpClient.delete<null>(`/event/${id}`),
};

export function mapInternalEventToSummary(
  api: InternalEventApiData,
  brandName: string,
  brandSlug: string,
): EventSummary {
  const normalized = normalizeEvent(api as InternalEventApiData & Record<string, unknown>);

  let feStatus: EventSummary["status"] = "draft";
  if (normalized.isPublished && normalized.status === "ONGOING") feStatus = "published";
  else if (normalized.status === "ENDED") feStatus = "completed";
  else if (!normalized.isPublished) feStatus = "draft";

  return {
    id: normalized.id,
    name: normalized.name,
    brand: brandName,
    brand_slug: brandSlug,
    description: normalized.description ?? "",
    date: formatDate(normalized.startDate),
    location: normalized.venue ?? normalized.location ?? undefined,
    time: formatTime(normalized.startDate),
    status: feStatus,
  };
}

export function normalizeInternalEvent(api: InternalEventApiData): InternalEventApiData {
  return normalizeEvent(api as InternalEventApiData & Record<string, unknown>);
}
