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

  if (paymentMethod.id === "qris" || paymentMethod.category === "E_WALLET_QRIS") {
    return {
      transactionFee: Math.round(baseAmount * QRIS_TRANSACTION_RATE),
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

export function buildBaseOrderSummary(event: Event, items: OrderItem[]): OrderSummary {
  const subtotal = calculateSubtotal(items);
  const ticketCount = calculateTicketCount(items);
  const serviceFeePerTicket = Number(event.brandAdminFee ?? 0);
  const serviceFee = serviceFeePerTicket * ticketCount;

  return {
    subtotal,
    serviceFeePerTicket,
    serviceFee,
    transactionFee: 0,
    totalPrice: subtotal + serviceFee,
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

  return {
    ...baseSummary,
    transactionFee,
    transactionFeeDescription,
    totalPrice: baseAmount + transactionFee,
  };
}

export function formatServiceFeeBreakdown(summary: OrderSummary): string {
  return `${formatRupiah(summary.serviceFeePerTicket)} x ${summary.ticketCount} tiket`;
}
