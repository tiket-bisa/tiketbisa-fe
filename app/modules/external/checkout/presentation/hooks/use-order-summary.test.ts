import { describe, expect, it } from "vitest";

import type { OrderSummary, PaymentMethod } from "../../domain/checkout.types";
import { calculateTransactionFee, withTransactionFee } from "./use-order-summary";

const qrisMethod: PaymentMethod = {
  id: "qris",
  name: "QRIS",
  logo: "",
  category: "E_WALLET_QRIS",
};

const vaMethod: PaymentMethod = {
  id: "va",
  name: "Virtual Account",
  logo: "",
  category: "BANK_TRANSFER",
};

function buildSummary(overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    subtotal: 100000,
    adminFee: 0,
    serviceFee: 10000,
    transactionFee: 0,
    tax: 0,
    discount: 0,
    totalPrice: 110000,
    items: [{ ticketId: "tc-001", ticketName: "Regular", quantity: 1, price: 100000 }],
    ...overrides,
  };
}

describe("withTransactionFee", () => {
  it("subtracts the promo discount from the final total", () => {
    const summary = buildSummary({ discount: 20000 });

    const result = withTransactionFee(summary, null);

    // subtotal (100000) + serviceFee (10000) + transactionFee (0) - discount (20000)
    expect(result.totalPrice).toBe(90000);
    expect(result.discount).toBe(20000);
  });

  it("computes the transaction fee on the pre-discount base, not the discounted total", () => {
    const summary = buildSummary({ discount: 50000 });

    const result = withTransactionFee(summary, qrisMethod);

    // Fee base is (subtotal + serviceFee) = 110000, NOT (110000 - discount).
    const expectedFee = Math.round(110000 * 0.03);
    expect(result.transactionFee).toBe(expectedFee);

    // Total = subtotal + serviceFee + fee - discount, fee computed pre-discount.
    expect(result.totalPrice).toBe(100000 + 10000 + expectedFee - 50000);
  });

  it("applies a flat VA fee on the pre-discount base as well", () => {
    const summary = buildSummary({ discount: 15000 });

    const result = withTransactionFee(summary, vaMethod);

    expect(result.transactionFee).toBe(5000);
    expect(result.totalPrice).toBe(100000 + 10000 + 5000 - 15000);
  });

  it("does not go negative and treats missing/undefined discount as zero", () => {
    const summary = buildSummary({ discount: 0 });

    const result = withTransactionFee(summary, null);

    expect(result.totalPrice).toBe(110000);
  });
});

describe("calculateTransactionFee", () => {
  it("returns 0 when no method is selected", () => {
    expect(calculateTransactionFee(null, 100000)).toBe(0);
  });

  it("returns 3% for QRIS", () => {
    expect(calculateTransactionFee(qrisMethod, 100000)).toBe(3000);
  });

  it("returns a flat Rp5.000 for VA", () => {
    expect(calculateTransactionFee(vaMethod, 100000)).toBe(5000);
  });
});
