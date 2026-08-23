import type { Event } from "../../event/domain/event.entity";
import type { OrderItem, OrderSummary, PaymentMethod } from "./checkout.types";

const QRIS_TRANSACTION_RATE = 0.03;
const VA_TRANSACTION_FEE = 5000;

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateTicketCount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function buildTransactionFee(paymentMethod: PaymentMethod | null | undefined, baseAmount: number): {
  transactionFee: number;
  transactionFeeDescription?: string;
} {
  if (!paymentMethod) {
    return { transactionFee: 0 };
  }

  if (paymentMethod.feeType === "FLAT") {
    return { transactionFee: Math.round(paymentMethod.feeValue ?? 0), transactionFeeDescription: `${paymentMethod.name} Rp ${formatRupiah(paymentMethod.feeValue ?? 0)}` };
  }
  if (paymentMethod.feeType === "PERCENT") {
    const rate = paymentMethod.feeValue ?? 0;
    return { transactionFee: Math.ceil((baseAmount * rate) / 100), transactionFeeDescription: `${paymentMethod.name} ${rate}% dari sub total + biaya layanan` };
  }
  if (paymentMethod.feeType === "NONE") return { transactionFee: 0 };

  if (paymentMethod.id === "qris" || paymentMethod.category === "E_WALLET_QRIS") {
    return {
      transactionFee: Math.ceil((baseAmount * 3) / 100),
      transactionFeeDescription: "QRIS 3% dari sub total + biaya layanan",
    };
  }

  if (paymentMethod.id === "va") {
    return {
      transactionFee: VA_TRANSACTION_FEE,
      transactionFeeDescription: "Virtual Account Rp 5.000",
    };
  }

  return { transactionFee: 0 };
}

export function buildBaseOrderSummary(event: Event, items: OrderItem[], discount = 0): OrderSummary {
  const subtotal = calculateSubtotal(items);
  const ticketCount = calculateTicketCount(items);
  const serviceFeePerTicket = Number(event.brandAdminFee ?? 0);
  const serviceFee = serviceFeePerTicket * ticketCount;
  const appliedDiscount = Math.max(0, Math.round(discount || 0));

  return {
    subtotal,
    serviceFeePerTicket,
    serviceFee,
    transactionFee: 0,
    discount: appliedDiscount,
    totalPrice: subtotal + serviceFee - appliedDiscount,
    ticketCount,
    items,
  };
}

export function buildPaymentOrderSummary(
  baseSummary: OrderSummary,
  paymentMethod?: PaymentMethod | null,
): OrderSummary {
  const baseAmount = baseSummary.subtotal + baseSummary.serviceFee;
  const { transactionFee, transactionFeeDescription } = buildTransactionFee(paymentMethod, baseAmount);
  // Transaction fee is computed on the pre-discount base; the promo discount only reduces the final total.
  const discount = Math.max(0, Math.round(baseSummary.discount || 0));

  return {
    ...baseSummary,
    transactionFee,
    transactionFeeDescription,
    totalPrice: baseAmount + transactionFee - discount,
  };
}

export function formatServiceFeeBreakdown(summary: OrderSummary): string {
  return `${formatRupiah(summary.serviceFeePerTicket)} x ${summary.ticketCount} tiket`;
}
