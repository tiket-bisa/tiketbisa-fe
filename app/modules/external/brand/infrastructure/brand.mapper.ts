import type { Brand } from "../domain/brand.entity";
import type { BrandDto } from "./brand.dto";
import { normalizeImageUrl } from "~/core/api";

/**
 * Maps a raw BrandDto (from API) to the domain Brand entity.
 */

function generateFallbackCategory(id: string): string {
  // Use a pseudo-random category based on the ID for visual variety
  const num = id.length + (id.charCodeAt(0) || 0);
  const categories = ["Sport", "Music", "Tech", "Festival", "Community"];
  return categories[num % categories.length];
}

function generateFallbackLocation(id: string): string {
  const num = id.length + (id.charCodeAt(id.length - 1) || 0);
  const locations = ["Jakarta", "Bandung", "Surabaya", "Bali", "Yogyakarta"];
  return locations[num % locations.length];
}

function formatJoinedDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return "2026";
  }
}

export function mapBrandDtoToEntity(dto: BrandDto): Brand {
  const logoUrl = normalizeImageUrl(dto.logoPath ?? dto.logo_path);
  const bannerUrl = normalizeImageUrl(dto.bannerPath ?? dto.banner_path);

  return {
    id: dto.id,
    name: dto.name,
    slug: dto.id, // Using ID as slug since backend doesn't have a slug field yet
    logoUrl: logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.name)}&background=random`,
    bannerUrl: bannerUrl || `https://picsum.photos/seed/${dto.id}/1200/400`,
    description: dto.description || `Ini adalah halaman official dari ${dto.name}.`,
    // Fallbacks for fields not currently returned by backend
    category: generateFallbackCategory(dto.id),
    location: generateFallbackLocation(dto.id),
    joinedSince: formatJoinedDate(dto.created),
    socialMedia: [],
  };
}
