export interface TicketRowData {
  id: string;
  name: string;
  price: number;
  available: boolean;
  maxPerOrder?: number;
}
