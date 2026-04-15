import type { PaginatedApiResponse } from "~/core/api";
import type { Event } from "../domain/event.entity";
import type { EventRepository } from "../domain/event.repository";
import type { EventFilterParams } from "./event-filter.params";
import type { EventDto } from "./event.dto";
import { mapEventDtoToEntity } from "./event.mapper";

/* ─── Dummy Event DTOs ─── */
const DUMMY_EVENTS: any[] = [
  {
    id: "evt-001",
    name: "Persija vs Persib — Liga 1 2026",
    brand: "Adhyaksa FC",
    description: "Pertandingan seru Liga 1 antara Persija dan Persib",
  },
  {
    id: "evt-002",
    name: "Konser Tulus — Manusia World Tour",
    brand: "Musicverse",
    description: "Konser Tulus dalam rangka tur dunianya",
  },
  {
    id: "evt-003",
    name: "Jakarta Marathon 2026",
    brand: "RunID",
    description: "Lomba lari marathon tahunan di Jakarta",
  },
  {
    id: "evt-004",
    name: "Arema FC vs Persebaya — Derby Jatim",
    brand: "Adhyaksa FC",
    description: "Derby Jawa Timur yang selalu ditunggu",
  },
  {
    id: "evt-005",
    name: "Festival Jazz Gunung Bromo",
    brand: "Musicverse",
    description: "Festival jazz di lereng Gunung Bromo",
  },
  {
    id: "evt-006",
    name: "Bali Ultra Trail Run 50K",
    brand: "RunID",
    description: "Ultra trail run melewati persawahan dan hutan Bali",
  },
  {
    id: "evt-007",
    name: "PSM Makassar vs Bali United",
    brand: "Adhyaksa FC",
    description: "Pertandingan Liga 1 seri kedua",
  },
  {
    id: "evt-008",
    name: "Konser Isyana Sarasvati — Lexicon",
    brand: "Musicverse",
    description: "Konser album terbaru Isyana Sarasvati",
  },
  {
    id: "evt-009",
    name: "Surabaya Night Run 10K",
    brand: "RunID",
    description: "Lomba lari malam di pusat kota Surabaya",
  },
  {
    id: "evt-010",
    name: "PSIS Semarang vs Persija",
    brand: "Adhyaksa FC",
    description: "Pertandingan Liga 1 pekan ke-12",
  },
  {
    id: "evt-011",
    name: "Yogyakarta Gamelan Festival",
    brand: "Musicverse",
    description: "Festival musik gamelan kontemporer di Yogyakarta",
  },
  {
    id: "evt-012",
    name: "Bandung Heritage Run 5K",
    brand: "RunID",
    description: "Fun run melewati bangunan bersejarah Bandung",
  },
];

/* ─── Helper: apply client-side filters to dummy data ─── */
function applyFilters(events: Event[], params: EventFilterParams): Event[] {
  let filtered = [...events];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }

  if (params.brand_name) {
    filtered = filtered.filter(
      (e) => e.brand.toLowerCase() === params.brand_name!.toLowerCase(),
    );
  }

  if (params.city) {
    filtered = filtered.filter(
      (e) => e.location.toLowerCase() === params.city!.toLowerCase(),
    );
  }

  // Sort
  if (params.order_by) {
    switch (params.order_by) {
      case "name_asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "date_asc":
        // Already in order by date index
        break;
      case "date_desc":
        filtered.reverse();
        break;
    }
  }

  return filtered;
}

/* ─── Dummy API Implementation ─── */
export const eventApi: EventRepository = {
  async getEvents(
    params: EventFilterParams,
  ): Promise<PaginatedApiResponse<Event>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Map DTOs → entities
    const allEvents = DUMMY_EVENTS.map(mapEventDtoToEntity);

    // Apply client-side filters (will be replaced by server-side)
    const filtered = applyFilters(allEvents, params);

    // Paginate
    const start = params.offset;
    const end = start + params.limit;
    const page = filtered.slice(start, end);

    return {
      success: true,
      error: null,
      reason: null,
      status_code: 200,
      data: {
        limit: params.limit,
        offset: params.offset,
        count: filtered.length,
        event_list: page,
      },
    };
  },

  async getEventById(id: string): Promise<Event | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const dtoIndex = DUMMY_EVENTS.findIndex((e) => e.id === id);
    if (dtoIndex === -1) return null;

    const baseEvent = mapEventDtoToEntity(DUMMY_EVENTS[dtoIndex], dtoIndex);

    return {
      ...baseEvent,
      time: "19:00 - Selesai",
      terms: [
        "Tiket yang sudah dibeli tidak dapat dikembalikan.",
        "Pengunjung wajib membawa kartu identitas asli.",
        "Dilarang membawa makanan dan minuman dari luar.",
        "Penyelenggara berhak menolak pengunjung yang melanggar aturan.",
      ],
    };
  },
};
