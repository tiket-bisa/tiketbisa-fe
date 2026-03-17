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

    const response = await apiFetch<ApiResponse<EventListResponseData>>(
      `/event?${queryParams.toString()}`
    );

    return {
      ...response,
      data: {
        limit: response.data.limit,
        offset: response.data.offset,
        count: response.data.totalCount,
        event_list: response.data.events.map((dto, idx) =>
          mapEventDtoToEntity(dto, idx),
        ),
      },
    };
  },

  async getEventById(id: string): Promise<Event | null> {
    const [eventResponse, ticketsResponse] = await Promise.all([
      apiFetch<ApiResponse<EventDto>>(`/event/${id}`),
      apiFetch<ApiResponse<any[]>>(`/ticket-category/event/${id}`),
    ]);

    if (!eventResponse.data) return null;

    const baseEvent = mapEventDtoToEntity(eventResponse.data, 0);

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
      tickets: (ticketsResponse.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
        available: t.totalTicket > t.issuedTicket,
      })),
    };
  },
};
