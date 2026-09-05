import { eventApi } from "../../event/infrastructure/event.api";
import { brandApi } from "../../brand/infrastructure/brand.api";
import type { LandingRepository, LandingData, LandingParams } from "../domain/landing.repository";
import type { Banner } from "../domain/banner.entity";
import type { Event } from "../../event/domain/event.entity";
import type { Brand } from "../../brand/domain/brand.entity";

const MOCK_BANNERS: Banner[] = [
  {
    id: "banner-1",
    imageUrl: "/banner/Homepage.svg",
    alt: "Promo Spesial",
    title: "Diskon 50% Tiket Konser",
    description: "Nikmati penawaran terbatas untuk konser musik favoritmu bulan ini.",
    price: 50000,
  },
  {
    id: "banner-2",
    imageUrl: "/banner/KategoriEvent.svg",
    alt: "Liga 1",
    title: "Nonton Tim Kesayanganmu",
    description: "Tiket pertandingan Liga 1 2026 sudah tersedia. Beli sekarang sebelum kehabisan!",
    price: 35000,
  },
  {
    id: "banner-3",
    imageUrl: "/banner/Homepage.svg",
    alt: "Festival",
    title: "Festival Musik Terbesar 2026",
    description: "Hadirkan pengalaman tak terlupakan bersama musisi internasional pilihan.",
    price: 250000,
  },
];

function resolveTimeRange(value?: string): { endDate?: string } {
  const start = new Date();
  const end = new Date(start);
  if (value === "today") {
    end.setHours(23, 59, 59, 999);
  } else if (value === "this_week") {
    end.setDate(end.getDate() + 7);
  } else if (value === "this_month") {
    end.setMonth(end.getMonth() + 1);
  } else {
    return {};
  }
  return { endDate: end.toISOString() };
}

function resolvePriceRange(value?: string): { minPrice?: number; maxPrice?: number } {
  if (value === "0-50000") return { minPrice: 0, maxPrice: 50_000 };
  if (value === "50000-100000") return { minPrice: 50_000, maxPrice: 100_000 };
  if (value === "100000-plus") return { minPrice: 100_000 };
  return {};
}

export const landingApi: LandingRepository = {
  async getLandingData(params: LandingParams): Promise<LandingData> {
    const timeRange = resolveTimeRange(params.eventFilters?.time);
    const priceRange = resolvePriceRange(params.eventFilters?.price);
    const [brandRes, featuredRes, upcomingRes] = await Promise.all([
      brandApi.getBrands({ 
        limit: 5, 
        offset: 0,
        category: params.partnerCategory 
      }),
      eventApi.getEvents({
        limit: 8,
        offset: 0,
        order_by: "date_asc",
        is_featured: true,
        status: "ONGOING",
      }),
      eventApi.getEvents({
        limit: 8,
        offset: 0,
        order_by: "date_asc",
        status: "ONGOING",
        city: params.eventFilters?.city,
        category: params.eventFilters?.category,
        end_date: timeRange.endDate,
        min_price: priceRange.minPrice,
        max_price: priceRange.maxPrice,
      }),
    ]);

    let featuredEvents = featuredRes.data.event_list as Event[];
    if (featuredEvents.length === 0) {
      const fallback = await eventApi.getEvents({
        limit: 1,
        offset: 0,
        order_by: "date_asc",
        status: "ONGOING",
      });
      featuredEvents = fallback.data.event_list as Event[];
    }

    return {
      banners: MOCK_BANNERS,
      partners: brandRes.data.brand_list as Brand[],
      featuredEvents,
      upcomingEvents: upcomingRes.data.event_list as Event[],
      totalUpcoming: upcomingRes.data.count,
    };
  },
};
