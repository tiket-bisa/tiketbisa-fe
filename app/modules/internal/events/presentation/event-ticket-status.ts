import type { IssuedTicketSummary } from "~/core/api/services/internal-event.api";

type TicketStatusInput = Pick<IssuedTicketSummary, "status" | "transactionStatus">;

export function getEventTicketDisplayStatus(ticket: TicketStatusInput): string {
  if (ticket.status === "WAITING_APPROVAL" && ticket.transactionStatus === "WAITING_PAYMENT") {
    return "WAITING_PAYMENT";
  }
  return ticket.status;
}

const transactionStatusLabels: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu Pembayaran",
  WAITING_APPROVAL: "Menunggu Approval",
  PAID: "Lunas",
  COMPLETED: "Lunas",
  CANCELED: "Dibatalkan",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Expired",
  REFUNDED: "Refund",
};

export function getEventTransactionStatusLabel(status?: string | null): string {
  return status ? transactionStatusLabels[status] ?? status : "-";
}
