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
  brandAdminFee?: number;
  description: string;
  imageUrl: string;
  galleryImages?: string[];
  date: string;
  /** Raw ISO start/end dates from the backend (before display formatting). */
  startDate?: string;
  endDate?: string;
  /** Event lifecycle status: "ONGOING" or "ENDED". */
  status?: string;
  location: string;
  minPrice?: number;
  time?: string;
  tickets: EventTicket[];
  terms?: string[];
}
