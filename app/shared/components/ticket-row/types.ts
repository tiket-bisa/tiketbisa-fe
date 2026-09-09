export interface TicketRowData {
  id: string;
  name: string;
  price: number;
  available: boolean;
  purchaseStatus?: "AVAILABLE" | "SOLD_OUT" | "SALES_CLOSED" | "EVENT_ENDED";
  maxPerOrder?: number;
}
