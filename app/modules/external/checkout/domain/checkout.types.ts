export interface BuyerInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  identityType: string;
  identityNumber: string;
}

export interface OrderItem {
  ticketId: string;
  ticketName: string;
  price: number;
  quantity: number;
}

export interface OrderSummary {
  subtotal: number;
  adminFee: number;
  totalPrice: number;
  items: OrderItem[];
}
