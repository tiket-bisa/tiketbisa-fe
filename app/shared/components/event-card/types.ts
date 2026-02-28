import type { EventTicket } from "~/modules/external/event/domain/event.entity";

export interface EventCardData {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  location: string;
  tickets: EventTicket[];
  brandName?: string;
  brandLogoUrl?: string;
}
