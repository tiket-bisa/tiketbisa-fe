/**
 * EventDto — Raw shape returned by GET /event → data.events[]
 */
export interface EventDto {
  id: string;
  brandId: string;
  name: string;
  bannerPath: string | null;
  startDate: string; // ISO string from backend
  endDate: string; // ISO string from backend
  description: string | null;
  termAndCondition: string | null;
  venue: string | null;
  location: string | null;
  city: string | null;
  status: string;
  isPublished: boolean;
  minPrice: number | null;
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
