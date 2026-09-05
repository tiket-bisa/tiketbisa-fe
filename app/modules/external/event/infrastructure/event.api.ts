import { apiFetch, normalizeImageUrl } from "~/core/api";
import type { PaginatedApiResponse, ApiResponse } from "~/core/api";
import type { Event } from "../domain/event.entity";
import type { EventRepository } from "../domain/event.repository";
import type { EventFilterParams } from "./event-filter.params";
import type { EventDto, EventImageDto } from "./event.dto";
import { mapEventDtoToEntity, formatEventTimeRange } from "./event.mapper";

interface EventListResponseData {
  limit: number;
  offset: number;
  totalCount: number;
  events: EventDto[];
}

interface TicketCategoryListItem {
  price: number | string;
}

interface TicketCategoryDto {
  id: string;
  name: string;
  price: number | string;
  totalTicket: number;
  issuedTicket: number;
}

interface BrandListResponseData {
  brands: BrandDto[];
}

interface BrandDto {
  id: string;
  name: string;
  logoPath?: string | null;
  logo_path?: string | null;
  adminFee?: number;
  admin_fee?: number;
}

interface EventImageListResponseData {
  images: EventImageDto[];
}

interface EventBrandMetadata {
  name?: string;
  logoUrl?: string;
  adminFee: number;
}

async function getBrandMap(): Promise<Map<string, EventBrandMetadata>> {
  try {
    const response = await apiFetch<ApiResponse<BrandListResponseData>>(
      "/brand?limit=1000&offset=0",
    );

    return new Map(
      (response.data?.brands || [])
        .filter((brand) => brand.id && brand.name)
        .map((brand) => [brand.id, {
          name: brand.name,
          logoUrl: normalizeImageUrl(brand.logoPath ?? brand.logo_path) || undefined,
          adminFee: Number(brand.adminFee ?? brand.admin_fee ?? 0),
        }]),
    );
  } catch {
    return new Map();
  }
}

async function getBrandDetailsById(brandId: string | undefined): Promise<EventBrandMetadata> {
  if (!brandId) return { adminFee: 0 };

  try {
    const response = await apiFetch<ApiResponse<BrandDto>>(`/brand/${brandId}`);
    return {
      name: response.data?.name || undefined,
      logoUrl: normalizeImageUrl(response.data?.logoPath ?? response.data?.logo_path) || undefined,
      adminFee: Number(response.data?.adminFee ?? response.data?.admin_fee ?? 0),
    };
  } catch {
    return { adminFee: 0 };
  }
}

function normalizeEventImages(images: EventImageDto[] | undefined, fallbackImageUrl: string): string[] {
  const urls = (images ?? [])
    .sort((a, b) => {
      const aCover = Boolean(a.isCover ?? a.is_cover);
      const bCover = Boolean(b.isCover ?? b.is_cover);
      return Number(bCover) - Number(aCover)
        || Number(a.sortOrder ?? a.sort_order ?? 0) - Number(b.sortOrder ?? b.sort_order ?? 0);
    })
    .map((image) => normalizeImageUrl(image.imageUrl ?? image.image_url))
    .filter(Boolean);
  if (urls.length > 0) return urls;
  return fallbackImageUrl ? [fallbackImageUrl] : [];
}

export const eventApi: EventRepository = {
  async getEvents(
    params: EventFilterParams,
  ): Promise<PaginatedApiResponse<Event>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("name", params.search);
    if (params.city) queryParams.append("city", params.city);
    if (params.brand_id) queryParams.append("brandId", params.brand_id);
    if (params.status) queryParams.append("status", params.status);
    if (params.is_featured !== undefined) queryParams.append("isFeatured", String(params.is_featured));
    if (params.category) queryParams.append("category", params.category);
    if (params.start_date) queryParams.append("startDate", params.start_date);
    if (params.end_date) queryParams.append("endDate", params.end_date);
    if (params.min_price !== undefined) queryParams.append("minPrice", String(params.min_price));
    if (params.max_price !== undefined) queryParams.append("maxPrice", String(params.max_price));
    if (params.order_by) {
      const sortBy: Record<string, string> = {
        date_asc: "start_date:ASC",
        date_desc: "start_date:DESC",
        name_asc: "name:ASC",
        name_desc: "name:DESC",
      };
      queryParams.append("sortBy", sortBy[params.order_by] ?? params.order_by);
    }
    queryParams.append("limit", params.limit.toString());
    queryParams.append("offset", params.offset.toString());
    queryParams.append("isPublished", "true");

    const [response, brandMap] = await Promise.all([
      apiFetch<ApiResponse<EventListResponseData>>(
        `/event?${queryParams.toString()}`,
      ),
      getBrandMap(),
    ]);

    const visibilityBoundary = Date.now();
    const visibleDtos = response.data.events.filter((dto) => {
      if (params.status !== "ONGOING") return true;
      const endDate = dto.endDate ?? dto.end_date;
      if (!endDate) return true;
      const endTime = new Date(endDate).getTime();
      return Number.isNaN(endTime) || endTime > visibilityBoundary;
    });

    const mappedEvents = await Promise.all(
      visibleDtos.map(async (dto, idx) => {
        const brandId = dto.brandId ?? dto.brand_id ?? "";
        const mapped = mapEventDtoToEntity(dto, idx, brandMap.get(brandId));

        if (mapped.minPrice !== undefined && mapped.minPrice !== null) {
          return mapped;
        }

        try {
          const ticketResponse = await apiFetch<ApiResponse<TicketCategoryListItem[]>>(
            `/ticket-category/event/${dto.id}`,
          );

          const prices = (ticketResponse.data || [])
            .map((ticket) => Number(ticket.price))
            .filter((price) => Number.isFinite(price) && price >= 0);

          if (prices.length > 0) {
            mapped.minPrice = Math.min(...prices);
          }
        } catch {
          // Keep fallback behavior when ticket category fetch fails.
        }

        return mapped;
      }),
    );

    return {
      ...response,
      data: {
        limit: response.data.limit,
        offset: response.data.offset,
        count: response.data.totalCount,
        event_list: mappedEvents,
      },
    };
  },

  async getEventById(id: string): Promise<Event | null> {
    const [eventResponse, ticketsResponse, imagesResponse] = await Promise.all([
      apiFetch<ApiResponse<EventDto>>(`/event/${id}`),
      apiFetch<ApiResponse<TicketCategoryDto[]>>(`/ticket-category/event/${id}`),
      apiFetch<ApiResponse<EventImageListResponseData>>(`/event/${id}/images`).catch(() => null),
    ]);

    if (!eventResponse.data) return null;

    const brandDetails = await getBrandDetailsById(eventResponse.data.brandId ?? eventResponse.data.brand_id);
    const baseEvent = mapEventDtoToEntity(eventResponse.data, 0, brandDetails);
    const galleryImages = normalizeEventImages(imagesResponse?.data?.images, baseEvent.imageUrl);
    const termsText = eventResponse.data.termAndCondition ?? eventResponse.data.term_and_condition;

    return {
      ...baseEvent,
      brandAdminFee: brandDetails.adminFee,
      imageUrl: galleryImages[0] ?? baseEvent.imageUrl,
      galleryImages,
      time: formatEventTimeRange(
        eventResponse.data.startDate ?? eventResponse.data.start_date ?? "",
        eventResponse.data.endDate ?? eventResponse.data.end_date,
      ),
      terms: termsText
        ? termsText.split("\n")
        : [
            "Tiket yang sudah dibeli tidak dapat dikembalikan.",
            "Pengunjung wajib membawa kartu identitas asli.",
            "Dilarang membawa makanan dan minuman dari luar.",
            "Penyelenggara berhak menolak pengunjung yang melanggar aturan.",
          ],
      tickets: (ticketsResponse.data || []).map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
        available: t.totalTicket > t.issuedTicket,
      })),
    };
  },
};
