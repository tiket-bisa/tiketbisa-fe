import type { EventTicket } from "../../../../event/domain/event.entity";

export function getTicketCategoryName(tickets: EventTicket[], categoryId: string): string {
  return tickets.find((ticket) => ticket.id === categoryId)?.name || "Kategori tidak tersedia";
}
