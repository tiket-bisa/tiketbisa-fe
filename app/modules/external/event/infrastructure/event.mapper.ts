import type { Event } from "../domain/event.entity";
import type { EventDto } from "./event.dto";

/**
 * Maps a raw EventDto (from API) to the domain Event entity.
 *
 * Since the API currently only returns id/name/brand/description,
 * we fill the remaining UI fields with deterministic placeholder values.
 * Once the backend extends the contract, swap these fallbacks with
 * actual DTO fields.
 */

const placeholderImages = [
  "https://placehold.co/600x400/6D5CFF/white?text=Event",
  "https://placehold.co/600x400/22C7A9/white?text=Event",
  "https://placehold.co/600x400/FF6D5C/white?text=Event",
  "https://placehold.co/600x400/5C8AFF/white?text=Event",
];

const placeholderLocations = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Bali",
];

const placeholderPrices = [
  "Rp 50.000 – Rp 150.000",
  "Rp 75.000 – Rp 200.000",
  "Rp 25.000 – Rp 100.000",
  "Rp 100.000 – Rp 350.000",
  "Gratis",
  "Rp 150.000 – Rp 500.000",
];

function generatePlaceholderDate(index: number): string {
  const base = new Date(2026, 2, 1); // March 2026
  base.setDate(base.getDate() + ((index * 3) % 30));
  return base.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function mapEventDtoToEntity(dto: EventDto, index: number): Event {
  return {
    id: dto.id,
    name: dto.name,
    brand: dto.brand,
    description: dto.description,
    imageUrl: placeholderImages[index % placeholderImages.length],
    date: generatePlaceholderDate(index),
    location: placeholderLocations[index % placeholderLocations.length],
    priceRange: placeholderPrices[index % placeholderPrices.length],
  };
}
