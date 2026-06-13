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

export interface EventBannerUploadResponse {
  bannerUrl: string;
}

export interface EventImageData {
  id: string;
  eventId: string;
  imageUrl: string;
  sortOrder: number;
  isCover: boolean;
}

interface EventImageApiData extends Record<string, unknown> {
  id?: string;
  eventId?: string;
  event_id?: string;
  imageUrl?: string;
  image_url?: string;
  sortOrder?: number;
  sort_order?: number;
  isCover?: boolean;
  is_cover?: boolean;
}

export interface EventImageListResponse {
  images: EventImageApiData[];
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

export interface EventTicketCategorySummary {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  categoryCode?: string | null;
  totalTicket: number;
  issuedTicket: number;
  checkedInTicket: number;
  remainingTicket: number;
  soldTicket: number;
  price: number;
}

export interface IssuedTicketSummary {
  id: string;
  ticketCategoryId: string;
  categoryName: string;
  categoryCode?: string | null;
  ticketTransactionId?: string | null;
  codeHash?: string | null;
  codeType?: string | null;
  status: string;
  checkInTime?: string | null;
  ticketEventNumber?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  transactionStatus?: string | null;
  paymentMethod?: string | null;
  created?: string | null;
}

interface EventTicketCategoryApiData extends Record<string, unknown> {
  id?: string;
  eventId?: string;
  event_id?: string;
  name?: string;
  description?: string | null;
  categoryCode?: string | null;
  category_code?: string | null;
  totalTicket?: number;
  total_ticket?: number;
  issuedTicket?: number;
  issued_ticket?: number;
  checkedInTicket?: number;
  checked_in_ticket?: number;
  remainingTicket?: number;
  remaining_ticket?: number;
  soldTicket?: number;
  sold_ticket?: number;
  price?: number;
}

interface IssuedTicketApiData extends Record<string, unknown> {
  id?: string;
  ticketCategoryId?: string;
  ticket_category_id?: string;
  categoryName?: string;
  category_name?: string;
  categoryCode?: string | null;
  category_code?: string | null;
  ticketTransactionId?: string | null;
  ticket_transaction_id?: string | null;
  codeHash?: string | null;
  code_hash?: string | null;
  codeType?: string | null;
  code_type?: string | null;
  status?: string;
  checkInTime?: string | null;
  check_in_time?: string | null;
  ticketEventNumber?: number | null;
  ticket_event_number?: number | null;
  customerName?: string | null;
  customer_name?: string | null;
  customerEmail?: string | null;
  customer_email?: string | null;
  customerPhone?: string | null;
  customer_phone?: string | null;
  transactionStatus?: string | null;
  transaction_status?: string | null;
  paymentMethod?: string | null;
  payment_method?: string | null;
  created?: string | null;
}

interface EventTicketDashboardApiData {
  event: InternalEventApiData;
  categories?: EventTicketCategoryApiData[];
  issuedTickets?: IssuedTicketApiData[];
  issued_tickets?: IssuedTicketApiData[];
}

export interface EventTicketDashboard {
  event: InternalEventApiData;
  categories: EventTicketCategorySummary[];
  issuedTickets: IssuedTicketSummary[];
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

function normalizeEventImage(api: EventImageApiData): EventImageData {
  return {
    id: String(api.id ?? ""),
    eventId: String(api.eventId ?? api.event_id ?? ""),
    imageUrl: String(api.imageUrl ?? api.image_url ?? ""),
    sortOrder: Number(api.sortOrder ?? api.sort_order ?? 0),
    isCover: Boolean(api.isCover ?? api.is_cover),
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

function normalizeEventTicketCategory(api: EventTicketCategoryApiData): EventTicketCategorySummary {
  return {
    id: String(api.id ?? ""),
    eventId: String(api.eventId ?? api.event_id ?? ""),
    name: String(api.name ?? ""),
    description: (api.description ?? null) as string | null,
    categoryCode: (api.categoryCode ?? api.category_code ?? null) as string | null,
    totalTicket: Number(api.totalTicket ?? api.total_ticket ?? 0),
    issuedTicket: Number(api.issuedTicket ?? api.issued_ticket ?? 0),
    checkedInTicket: Number(api.checkedInTicket ?? api.checked_in_ticket ?? 0),
    remainingTicket: Number(api.remainingTicket ?? api.remaining_ticket ?? 0),
    soldTicket: Number(api.soldTicket ?? api.sold_ticket ?? api.issuedTicket ?? api.issued_ticket ?? 0),
    price: Number(api.price ?? 0),
  };
}

function normalizeIssuedTicket(api: IssuedTicketApiData): IssuedTicketSummary {
  return {
    id: String(api.id ?? ""),
    ticketCategoryId: String(api.ticketCategoryId ?? api.ticket_category_id ?? ""),
    categoryName: String(api.categoryName ?? api.category_name ?? ""),
    categoryCode: (api.categoryCode ?? api.category_code ?? null) as string | null,
    ticketTransactionId: (api.ticketTransactionId ?? api.ticket_transaction_id ?? null) as string | null,
    codeHash: (api.codeHash ?? api.code_hash ?? null) as string | null,
    codeType: (api.codeType ?? api.code_type ?? null) as string | null,
    status: String(api.status ?? ""),
    checkInTime: (api.checkInTime ?? api.check_in_time ?? null) as string | null,
    ticketEventNumber: (api.ticketEventNumber ?? api.ticket_event_number ?? null) as number | null,
    customerName: (api.customerName ?? api.customer_name ?? null) as string | null,
    customerEmail: (api.customerEmail ?? api.customer_email ?? null) as string | null,
    customerPhone: (api.customerPhone ?? api.customer_phone ?? null) as string | null,
    transactionStatus: (api.transactionStatus ?? api.transaction_status ?? null) as string | null,
    paymentMethod: (api.paymentMethod ?? api.payment_method ?? null) as string | null,
    created: (api.created ?? null) as string | null,
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

  uploadBanner: (data: {
    bannerBase64: string;
    bannerMimeType: string;
    bannerFileName: string;
  }) =>
    internalHttpClient.post<EventBannerUploadResponse>("/event/banner/upload", data),

  getImages: async (eventId: string) => {
    const response = await internalHttpClient.get<EventImageListResponse>(`/event/${eventId}/images`);
    return {
      ...response,
      data: response.data
        ? { images: (response.data.images ?? []).map(normalizeEventImage) }
        : response.data,
    };
  },

  addImage: (eventId: string, data: { imageUrl: string; sortOrder?: number; isCover?: boolean }) =>
    internalHttpClient.post<EventImageData>(`/event/${eventId}/images`, data),

  reorderImages: async (
    eventId: string,
    data: { images: { id: string; sortOrder: number }[]; coverImageId?: string },
  ) => {
    const response = await internalHttpClient.put<EventImageListResponse>(`/event/${eventId}/images/reorder`, data);
    return {
      ...response,
      data: response.data
        ? { images: (response.data.images ?? []).map(normalizeEventImage) }
        : response.data,
    };
  },

  deleteImage: (eventId: string, imageId: string) =>
    internalHttpClient.delete<null>(`/event/${eventId}/images/${imageId}`),

  getSponsors: async (eventId: string) => {
    const response = await internalHttpClient.get<SponsorListResponse>(`/event/${eventId}/sponsors`);
    return normalizeSponsorListResponse(response);
  },

  addSponsor: (eventId: string, data: SponsorCreateUpdateRequest) =>
    internalHttpClient.post<SponsorData>(`/event/${eventId}/sponsors`, data),

  updateSponsor: (eventId: string, sponsorId: string, data: SponsorCreateUpdateRequest) =>
    internalHttpClient.put<SponsorData>(`/event/${eventId}/sponsors/${sponsorId}`, data),

  reorderSponsors: async (
    eventId: string,
    data: { sponsors: { id: string; sortOrder: number }[] },
  ) => {
    const response = await internalHttpClient.put<SponsorListResponse>(`/event/${eventId}/sponsors/reorder`, data);
    return normalizeSponsorListResponse(response);
  },

  deleteSponsor: (eventId: string, sponsorId: string) =>
    internalHttpClient.delete<null>(`/event/${eventId}/sponsors/${sponsorId}`),

  getTicketDashboard: async (eventId: string) => {
    const response = await internalHttpClient.get<EventTicketDashboardApiData>(`/event/${eventId}/tickets/dashboard`);
    return {
      ...response,
      data: response.data
        ? {
            event: normalizeEvent(response.data.event as InternalEventApiData & Record<string, unknown>),
            categories: (response.data.categories ?? []).map(normalizeEventTicketCategory),
            issuedTickets: (response.data.issuedTickets ?? response.data.issued_tickets ?? []).map(normalizeIssuedTicket),
          }
        : response.data,
    };
  },
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
