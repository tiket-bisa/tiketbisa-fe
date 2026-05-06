import { apiFetch } from "~/core/api";
import type { PaginatedApiResponse, ApiResponse } from "~/core/api";
import type { Event } from "../domain/event.entity";
import type { EventRepository } from "../domain/event.repository";
import type { EventFilterParams } from "./event-filter.params";
import type { EventDto } from "./event.dto";
import { mapEventDtoToEntity } from "./event.mapper";

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
}

async function getBrandNameMap(): Promise<Map<string, string>> {
  try {
    const response = await apiFetch<ApiResponse<BrandListResponseData>>(
      "/brand?limit=1000&offset=0",
    );

    return new Map(
      (response.data?.brands || [])
        .filter((brand) => brand.id && brand.name)
        .map((brand) => [brand.id, brand.name]),
    );
  } catch {
    return new Map();
  }
}

async function getBrandNameById(brandId: string | undefined): Promise<string | undefined> {
  if (!brandId) return undefined;

  try {
    const response = await apiFetch<ApiResponse<BrandDto>>(`/brand/${brandId}`);
    return response.data?.name || undefined;
  } catch {
    return undefined;
  }
}

export const eventApi: EventRepository = {
  async getEvents(
    params: EventFilterParams,
  ): Promise<PaginatedApiResponse<Event>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("name", params.search);
    if (params.city) queryParams.append("city", params.city);
    queryParams.append("limit", params.limit.toString());
    queryParams.append("offset", params.offset.toString());
    queryParams.append("isPublished", "true");

    const [response, brandNameMap] = await Promise.all([
      apiFetch<ApiResponse<EventListResponseData>>(
        `/event?${queryParams.toString()}`,
      ),
      getBrandNameMap(),
    ]);

    const mappedEvents = await Promise.all(
      response.data.events.map(async (dto, idx) => {
        const mapped = mapEventDtoToEntity(dto, idx, brandNameMap.get(dto.brandId));

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
    const [eventResponse, ticketsResponse] = await Promise.all([
      apiFetch<ApiResponse<EventDto>>(`/event/${id}`),
      apiFetch<ApiResponse<TicketCategoryDto[]>>(`/ticket-category/event/${id}`),
    ]);

    if (!eventResponse.data) return null;

    const brandName = await getBrandNameById(eventResponse.data.brandId);
    const baseEvent = mapEventDtoToEntity(eventResponse.data, 0, brandName);

    return {
      ...baseEvent,
      time: "19:00 - Selesai",
      terms: eventResponse.data.termAndCondition
        ? eventResponse.data.termAndCondition.split("\n")
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
