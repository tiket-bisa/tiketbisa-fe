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

export const landingApi: LandingRepository = {
  async getLandingData(params: LandingParams): Promise<LandingData> {
    const [brandRes, featuredRes, upcomingRes] = await Promise.all([
      brandApi.getBrands({ 
        limit: 5, 
        offset: 0,
        category: params.partnerCategory 
      }),
      eventApi.getEvents({ 
        limit: 4, 
        offset: 0,
        order_by: "date_asc" 
      }),
      eventApi.getEvents({
        limit: 8,
        offset: 0,
        time_range: params.eventFilters?.time,
        city: params.eventFilters?.city,
        category: params.eventFilters?.category,
        price_range: params.eventFilters?.price,
      }),
    ]);

    return {
      banners: MOCK_BANNERS,
      partners: brandRes.data.brand_list as Brand[],
      featuredEvents: featuredRes.data.event_list as Event[],
      upcomingEvents: upcomingRes.data.event_list as Event[],
      totalUpcoming: upcomingRes.data.count,
    };
  },
};
