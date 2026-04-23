import type { Brand } from "../../brand/domain/brand.entity";
import type { Event } from "../../event/domain/event.entity";
import type { Banner } from "./banner.entity";

export interface LandingData {
  banners: Banner[];
  partners: Brand[];
  featuredEvents: Event[];
  upcomingEvents: Event[];
  totalUpcoming: number;
}

export interface LandingParams {
  partnerCategory?: string;
  eventFilters?: {
    time?: string;
    city?: string;
    category?: string;
    price?: string;
  };
}

export interface LandingRepository {
  getLandingData(params: LandingParams): Promise<LandingData>;
}
