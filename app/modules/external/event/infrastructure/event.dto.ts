/**
 * EventDto — Raw shape returned by GET /event → data.events[]
 */
export interface EventDto {
  id: string;
  brandId: string;
  brand_id?: string;
  name: string;
  bannerPath: string | null;
  banner_path?: string | null;
  startDate: string; // ISO string from backend
  start_date?: string;
  endDate: string; // ISO string from backend
  end_date?: string;
  description: string | null;
  termAndCondition: string | null;
  term_and_condition?: string | null;
  venue: string | null;
  location: string | null;
  city: string | null;
  status: string;
  isPublished: boolean;
  is_published?: boolean;
  minPrice: number | null;
  min_price?: number | null;
}

export interface EventImageDto {
  id: string;
  eventId?: string;
  event_id?: string;
  imageUrl?: string;
  image_url?: string;
  sortOrder?: number;
  sort_order?: number;
  isCover?: boolean;
  is_cover?: boolean;
}
