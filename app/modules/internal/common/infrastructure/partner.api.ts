import { ApiRequestError, internalHttpClient, toUserFacingResponseError } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface InternalBrandDto {
  id: string;
  name: string;
  logoPath?: string | null;
  bannerPath?: string | null;
  description?: string | null;
}

export interface InternalEventDto {
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
  status?: string | null;
  isPublished?: boolean | null;
}

export interface InternalTicketCategoryDto {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  categoryCode?: string | null;
  totalTicket?: number | null;
  issuedTicket?: number | null;
  checkedInTicket?: number | null;
  price?: number | string | null;
}

interface InternalBrandListResponse {
  totalCount: number;
  limit: number;
  offset: number;
  brands: InternalBrandDto[];
}

interface InternalEventListResponse {
  totalCount: number;
  limit: number;
  offset: number;
  events: InternalEventDto[];
}

const DEFAULT_LIMIT = 100;

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

function ensureSuccess<T>(response: ApiResponse<T>, defaultMessage: string): T {
  if (!response.success || response.data == null) {
    throw new ApiRequestError(toUserFacingResponseError(response, defaultMessage));
  }
  return response.data;
}

function normalizeText(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function slugify(value?: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getBrandPage(params: {
  offset: number;
  limit: number;
  name?: string;
}): Promise<InternalBrandListResponse> {
  const query = buildQueryString({
    offset: params.offset,
    limit: params.limit,
    name: params.name,
  });
  const response = await internalHttpClient.get<InternalBrandListResponse>(`/brand${query}`);
  return ensureSuccess(response, "Gagal mengambil data brand internal");
}

async function getEventPage(params: {
  offset: number;
  limit: number;
  brandId: string;
  isPublished?: boolean;
}): Promise<InternalEventListResponse> {
  const query = buildQueryString({
    offset: params.offset,
    limit: params.limit,
    brandId: params.brandId,
    isPublished: params.isPublished === undefined ? undefined : String(params.isPublished),
  });
  const response = await internalHttpClient.get<InternalEventListResponse>(`/event${query}`);
  return ensureSuccess(response, "Gagal mengambil data event internal");
}

export async function getAllInternalBrands(name?: string): Promise<InternalBrandDto[]> {
  const result: InternalBrandDto[] = [];
  let offset = 0;

  while (true) {
    const page = await getBrandPage({
      offset,
      limit: DEFAULT_LIMIT,
      name,
    });
    const brands = page.brands ?? [];
    result.push(...brands);

    if (brands.length === 0) break;
    if (typeof page.totalCount === "number" && result.length >= page.totalCount) break;
    if (brands.length < DEFAULT_LIMIT) break;

    offset += DEFAULT_LIMIT;
  }

  return result;
}

export async function findPartnerBrand(params: {
  brandName?: string;
  brandSlug?: string;
}): Promise<InternalBrandDto | null> {
  const normalizedName = normalizeText(params.brandName);
  const normalizedSlug = slugify(params.brandSlug ?? params.brandName);

  if (!normalizedName && !normalizedSlug) {
    return null;
  }

  if (params.brandName) {
    const nameMatches = await getAllInternalBrands(params.brandName);
    const exactNameMatch = nameMatches.find(
      (brand) => normalizeText(brand.name) === normalizedName,
    );
    if (exactNameMatch) {
      return exactNameMatch;
    }
    if (nameMatches.length === 1) {
      return nameMatches[0];
    }
  }

  const allBrands = await getAllInternalBrands();
  const slugMatch = allBrands.find((brand) => slugify(brand.name) === normalizedSlug);
  if (slugMatch) {
    return slugMatch;
  }

  if (normalizedName) {
    const nameMatch = allBrands.find((brand) => normalizeText(brand.name) === normalizedName);
    if (nameMatch) {
      return nameMatch;
    }
  }

  return null;
}

export async function getEventsByBrandId(brandId: string): Promise<InternalEventDto[]> {
  const result: InternalEventDto[] = [];
  let offset = 0;

  while (true) {
    const page = await getEventPage({
      offset,
      limit: DEFAULT_LIMIT,
      brandId,
    });
    const events = page.events ?? [];
    result.push(...events);

    if (events.length === 0) break;
    if (typeof page.totalCount === "number" && result.length >= page.totalCount) break;
    if (events.length < DEFAULT_LIMIT) break;

    offset += DEFAULT_LIMIT;
  }

  return result;
}

export async function getTicketCategoriesByEventId(eventId: string): Promise<InternalTicketCategoryDto[]> {
  const response = await internalHttpClient.get<InternalTicketCategoryDto[]>(
    `/ticket-category/event/${eventId}`,
  );
  return ensureSuccess(response, "Gagal mengambil data kategori tiket internal");
}
