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
