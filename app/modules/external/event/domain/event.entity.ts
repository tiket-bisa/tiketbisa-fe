export interface EventTicket {
  id: string;
  name: string;
  price: number;
  available: boolean;
  purchaseStatus?: "AVAILABLE" | "SOLD_OUT" | "SALES_CLOSED" | "EVENT_ENDED";
  maxPerOrder?: number;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  brandId?: string;
  brand: string;
  brandSlug?: string;
  brandLogoUrl?: string;
  brandAdminFee?: number;
  description: string;
  imageUrl: string;
  galleryImages?: string[];
  date: string;
  location: string;
  minPrice?: number;
  isFeatured?: boolean;
  /** ISO end timestamp used to derive public visibility while backend status catches up. */
  endDate?: string;
  time?: string;
  tickets: EventTicket[];
  terms?: string[];
  lifecycleStatus?: "ONGOING" | "ENDED";
}
