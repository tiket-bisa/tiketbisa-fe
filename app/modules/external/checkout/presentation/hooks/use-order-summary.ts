import { useMemo } from "react";
import type { OrderSummary, OrderItem, PaymentMethod } from "../../domain/checkout.types";
import type { Event } from "../../../event/domain/event.entity";
import { buildBaseOrderSummary } from "../../domain/checkout.pricing";

const QRIS_FEE_RATE = 0.03;
const VA_FEE_FLAT = 5000;

/**
 * "Biaya Transaksi" (payment gateway fee) based on the selected method.
 * QRIS = 3% of (subtotal + biaya layanan), VA = flat Rp5.000, others = 0.
 * Mirrors the authoritative backend calculation.
 */
export function calculateTransactionFee(
  method: PaymentMethod | null | undefined,
  baseAmount: number,
): number {
  if (!method) return 0;
  const id = method.id?.toLowerCase();
  if (id === "qris" || method.category === "E_WALLET_QRIS") {
    return Math.round(baseAmount * QRIS_FEE_RATE);
  }
  if (id === "va") return VA_FEE_FLAT;
  return 0;
}

/**
 * Re-derive totals once a payment method is chosen (adds "Biaya Transaksi").
 * Transaction fee is always computed on the pre-discount base (subtotal + serviceFee),
 * per the backend contract — the promo discount must not shrink the fee base.
 */
export function withTransactionFee(
  summary: OrderSummary,
  method: PaymentMethod | null | undefined,
): OrderSummary {
  const transactionFee = calculateTransactionFee(
    method,
    summary.subtotal + summary.serviceFee,
  );
  const discount = Math.max(0, Math.round(summary.discount || 0));
  return {
    ...summary,
    transactionFee,
    totalPrice: summary.subtotal + summary.serviceFee + transactionFee - discount,
  };
}

export function useOrderSummary(
  event: Event,
  searchParams: URLSearchParams,
  discount = 0,
) {
  const summary = useMemo<OrderSummary>(() => {
    const items: OrderItem[] = [];

    for (const [key, value] of searchParams.entries()) {
      const match = key.match(/^t\[(.+)\]$/);
      if (match) {
        const ticketId = match[1];
        const quantity = parseInt(value, 10);
        const ticket = event.tickets.find((t) => t.id === ticketId);

        if (ticket && quantity > 0) {
          items.push({
            ticketId: ticket.id,
            ticketName: ticket.name,
            price: ticket.price,
            quantity: quantity,
          });
        }
      }
    }

    // Biaya Layanan comes from event.brandAdminFee (per ticket); promo discount reduces total.
    return buildBaseOrderSummary(event, items, discount);
  }, [event, searchParams, discount]);

  return summary;
}
