export interface BuyerInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  identityType: string;
  identityNumber: string;
}

/** Per-ticket holder identity (KTP/NIK only — distinct from the buyer's `BuyerInfo`). */
export interface TicketHolder {
  name: string;
  identityNumber: string;
}

export interface OrderItem {
  ticketId: string;
  ticketName: string;
  price: number;
  quantity: number;
}

/** Business rule: an order may contain at most this many tickets total, across all categories. */
export const MAX_TICKETS_PER_ORDER = 4;

export interface OrderSummary {
  subtotal: number;
  serviceFeePerTicket: number;
  serviceFee: number;
  transactionFee: number;
  transactionFeeDescription?: string;
  /** Promo discount applied client-side for display only; backend recomputes authoritatively. */
  discount: number;
  totalPrice: number;
  ticketCount: number;
  items: OrderItem[];
}

export type PaymentCategory = "BANK_TRANSFER" | "E_WALLET_QRIS";

export interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  category: PaymentCategory;
}

export interface AppliedPromo {
  promoId: string;
  code: string;
  discount: number;
}

export interface PaymentSelection {
  methodId: string | null;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  promoCode?: string;
  appliedPromo?: AppliedPromo | null;
}

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  expiryTime: string;
  paymentInstructions?: string;
  virtualAccount?: string;
  qrCodeUrl?: string;
}
