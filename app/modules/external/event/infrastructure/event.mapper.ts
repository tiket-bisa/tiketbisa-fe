import type { Event } from "../domain/event.entity";
import type { EventDto } from "./event.dto";

/**
 * Maps a raw EventDto (from API) to the domain Event entity.
 */

const placeholderImages = [
  "https://placehold.co/600x400/6D5CFF/white?text=Event",
  "https://placehold.co/600x400/22C7A9/white?text=Event",
  "https://placehold.co/600x400/FF6D5C/white?text=Event",
  "https://placehold.co/600x400/5C8AFF/white?text=Event",
];

// Simple map for initial brand IDs from seed data
const BRAND_NAME_MAP: Record<string, string> = {
  "b-001": "Adhyaksa FC",
  "b-002": "Musicverse",
  "b-003": "RunID",
  "b-004": "TechAsia",
  "b-005": "CulinaryID",
};

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

export function mapEventDtoToEntity(dto: EventDto, index: number): Event {
  const anyDto = dto as any;
  return {
    id: dto.id,
    name: dto.name,
    brand: BRAND_NAME_MAP[dto.brandId] || dto.brandId || "Unknown Brand",
    description: dto.description || "",
    imageUrl: dto.bannerPath || placeholderImages[index % placeholderImages.length],
    date: formatEventDate(dto.startDate),
    location: dto.city || dto.location || "Online",
    minPrice: dto.minPrice ?? undefined,
    // Tickets are not yet supported by the backend in the list response
    tickets: [],
  };
}
