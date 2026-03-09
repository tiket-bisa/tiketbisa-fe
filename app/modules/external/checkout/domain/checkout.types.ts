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
  serviceFee: number;
  tax: number;
  totalPrice: number;
  items: OrderItem[];
}

export type PaymentCategory = "BANK_TRANSFER" | "E_WALLET_QRIS";

export interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  category: PaymentCategory;
}

export interface PaymentSelection {
  methodId: string | null;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  promoCode?: string;
}

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  expiryTime: string;
  paymentInstructions?: string;
}
