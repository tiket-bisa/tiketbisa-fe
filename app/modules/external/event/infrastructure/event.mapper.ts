import type { Event } from "../domain/event.entity";
import type { EventDto } from "./event.dto";
import { normalizeImageUrl } from "~/core/api";

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

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: JAKARTA_TIME_ZONE,
    });
  } catch (e) {
    return dateStr;
  }
}

/** Formats "startTime - endTime"; falls back to "startTime - Selesai" if the end date is missing/invalid. */
export function formatEventTimeRange(startDateStr: string, endDateStr?: string): string {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: JAKARTA_TIME_ZONE,
    });

  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return "";
  const startTime = formatTime(start);

  const end = endDateStr ? new Date(endDateStr) : null;
  if (!end || Number.isNaN(end.getTime())) return `${startTime} - Selesai`;

  return `${startTime} - ${formatTime(end)}`;
}

export function mapEventDtoToEntity(
  dto: EventDto,
  index: number,
  brand?: { name?: string; logoUrl?: string },
): Event {
  const brandId = dto.brandId ?? dto.brand_id ?? "";
  const startDate = dto.startDate ?? dto.start_date ?? "";
  const endDate = dto.endDate ?? dto.end_date ?? "";
  const bannerUrl = normalizeImageUrl(dto.bannerPath ?? dto.banner_path);

  return {
    id: dto.id,
    name: dto.name,
    brandId,
    brand: brand?.name || BRAND_NAME_MAP[brandId] || brandId || "Unknown Brand",
    brandLogoUrl: brand?.logoUrl || undefined,
    description: dto.description || "",
    imageUrl: bannerUrl || placeholderImages[index % placeholderImages.length],
    date: formatEventDate(startDate),
    location: dto.city || dto.location || "Online",
    minPrice: dto.minPrice ?? dto.min_price ?? undefined,
    isFeatured: dto.isFeatured ?? dto.is_featured ?? false,
    endDate: endDate || undefined,
    // Tickets are not yet supported by the backend in the list response
    tickets: [],
  };
}
