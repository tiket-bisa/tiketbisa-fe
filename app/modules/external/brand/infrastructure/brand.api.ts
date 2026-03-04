import type { BrandFilterParams } from "./brand-filter.params";
import type { Brand } from "../domain/brand.entity";

// Dummy data implementation to simulate API request
const DUMMY_BRANDS: Brand[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `brand-${i + 1}`,
  name: `Brand ${i + 1}`,
  slug: `brand-${i + 1}`,
  logoUrl: `https://ui-avatars.com/api/?name=Brand+${i + 1}&background=random`,
  bannerUrl: `https://picsum.photos/seed/brand-${i + 1}/1200/400`,
  description: `Ini adalah deskripsi untuk Brand ${i + 1}. Brand ini berfokus pada kualitas dan pengalaman terbaik untuk para pelanggannya.`,
  category: ["sepak-bola", "lari", "musik"][i % 3],
  location: ["jakarta", "bandung", "surabaya"][i % 3],
  joinedSince: "Januari 2024",
  socialMedia: [
    { platform: "instagram", url: "https://instagram.com" },
    { platform: "twitter", url: "https://twitter.com" },
  ],
}));

export const brandApi = {
  getBrands: async (params: BrandFilterParams) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    let filtered = [...DUMMY_BRANDS];

    if (params.category) {
      filtered = filtered.filter((b) => b.category === params.category);
    }
    if (params.location) {
      filtered = filtered.filter((b) => b.location === params.location);
    }

    if (params.order_by === "name_asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params.order_by === "name_desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    const count = filtered.length;
    const limit = params.limit ?? 12;
    const offset = params.offset ?? 0;
    
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: {
        brand_list: paginated,
        count,
        limit,
        offset,
      },
    };
  },

  getBrandBySlug: async (slug: string): Promise<Brand | null> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const brand = DUMMY_BRANDS.find((b) => b.slug === slug);
    return brand ?? null;
  }
};
