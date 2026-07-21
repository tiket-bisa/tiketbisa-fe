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
  /** "Biaya Layanan" per ticket = brand.admin_fee. */
  serviceFeePerTicket: number;
  /** "Biaya Layanan" total = serviceFeePerTicket x jumlah tiket. */
  serviceFee: number;
  /** "Biaya Transaksi" (payment gateway): QRIS 3% / VA Rp5.000. */
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

/** Gateway payment status as reported by FLIP (VA/QRIS), threaded through completion + status polling. */
export type GatewayStatus = "PENDING" | "SUCCESSFUL" | "EXPIRED" | "FAILED";

export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  expiryTime: string;
  paymentInstructions?: string;
  virtualAccount?: string | null;
  qrCodeUrl?: string;
  /** Raw QRIS payload from the gateway (may be a scannable string or a deep-link URL). */
  qrPayload?: string | null;
  gatewayStatus?: GatewayStatus | null;
  /** ISO timestamp for when the gateway-issued VA/QRIS bill expires. */
  gatewayExpiry?: string | null;
}
