export interface TicketRowData {
  id: string;
  name: string;
  price: number;
  available: boolean;
  purchaseStatus?: "AVAILABLE" | "SOLD_OUT" | "SALES_CLOSED" | "EVENT_ENDED";
  /** Seats a buyer can still take, already net of reservations held mid-checkout. */
  remaining?: number;
  maxPerOrder?: number;
}
