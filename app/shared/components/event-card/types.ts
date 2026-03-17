import type { EventTicket } from "~/modules/external/event/domain/event.entity";

export interface EventCardData {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  location: string;
  minPrice?: number;
  tickets: EventTicket[];
  brandName?: string;
  brandLogoUrl?: string;
}

export interface EventCardProps {
  event: EventCardData;
  className?: string;
}
