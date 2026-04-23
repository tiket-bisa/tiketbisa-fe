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
  brand: string;
  description: string;
  imageUrl: string;
  date: string;
  location: string;
  time?: string;
  tickets: EventTicket[];
  terms?: string[];
}
