import { describe, expect, it } from "vitest";

import type { Event } from "../../event/domain/event.entity";
import type { PaymentMethod } from "./checkout.types";
import { buildBaseOrderSummary, buildPaymentOrderSummary } from "./checkout.pricing";

const mockEvent: Event = {
  id: "event-1",
  name: "Concert Night",
  brandId: "brand-1",
  brand: "Brand One",
  brandAdminFee: 7500,
  description: "",
  imageUrl: "",
  date: "2026-06-24",
  location: "Jakarta",
  tickets: [],
};

const mockItems = [
  { ticketId: "ticket-1", ticketName: "Regular", price: 50000, quantity: 2 },
  { ticketId: "ticket-2", ticketName: "VIP", price: 100000, quantity: 1 },
];

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

describe("checkout pricing", () => {
  it("builds base summary using brand admin fee per ticket", () => {
    const summary = buildBaseOrderSummary(mockEvent, mockItems);

    expect(summary.subtotal).toBe(200000);
    expect(summary.ticketCount).toBe(3);
    expect(summary.serviceFeePerTicket).toBe(7500);
    expect(summary.serviceFee).toBe(22500);
    expect(summary.transactionFee).toBe(0);
    expect(summary.totalPrice).toBe(222500);
  });

  it("adds QRIS transaction fee at 3 percent of subtotal plus service fee", () => {
    const baseSummary = buildBaseOrderSummary(mockEvent, mockItems);
    const summary = buildPaymentOrderSummary(baseSummary, qrisMethod);

    expect(summary.transactionFee).toBe(6675);
    expect(summary.transactionFeeDescription).toContain("QRIS 3%");
    expect(summary.totalPrice).toBe(229175);
  });

  it("adds flat VA transaction fee", () => {
    const baseSummary = buildBaseOrderSummary(mockEvent, mockItems);
    const summary = buildPaymentOrderSummary(baseSummary, vaMethod);

    expect(summary.transactionFee).toBe(5000);
    expect(summary.transactionFeeDescription).toContain("Virtual Account");
    expect(summary.totalPrice).toBe(227500);
  });
});
