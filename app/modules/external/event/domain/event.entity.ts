export interface EventTicket {
  id: string;
  name: string;
  price: number;
  available: boolean;
  maxPerOrder?: number;
}

export interface Event {
  id: string;
  name: string;
  brandId?: string;
  brand: string;
  brandLogoUrl?: string;
  brandAdminFee?: number;
  description: string;
  imageUrl: string;
  galleryImages?: string[];
  date: string;
  location: string;
  minPrice?: number;
  isFeatured?: boolean;
  time?: string;
  tickets: EventTicket[];
  terms?: string[];
}
