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
  description: string;
  imageUrl: string;
  date: string;
  location: string;
  minPrice?: number;
  time?: string;
  tickets: EventTicket[];
  terms?: string[];
}
