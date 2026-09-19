import { describe, expect, it } from "vitest";
import { getEventTicketDisplayStatus, getEventTransactionStatusLabel } from "./event-ticket-status";

describe("event ticket status", () => {
  it("shows waiting for payment for a pending ticket in a VA transaction", () => {
    expect(getEventTicketDisplayStatus({ status: "WAITING_APPROVAL", transactionStatus: "WAITING_PAYMENT" }))
      .toBe("WAITING_PAYMENT");
    expect(getEventTransactionStatusLabel("WAITING_PAYMENT")).toBe("Menunggu Pembayaran");
  });

  it("keeps manual transfer approval separate from payment", () => {
    expect(getEventTicketDisplayStatus({ status: "WAITING_APPROVAL", transactionStatus: "WAITING_APPROVAL" }))
      .toBe("WAITING_APPROVAL");
    expect(getEventTransactionStatusLabel("WAITING_APPROVAL")).toBe("Menunggu Approval");
  });

  it("keeps issued tickets issued and labels completed payment", () => {
    expect(getEventTicketDisplayStatus({ status: "ISSUED", transactionStatus: "COMPLETED" })).toBe("ISSUED");
    expect(getEventTransactionStatusLabel("COMPLETED")).toBe("Lunas");
    expect(getEventTransactionStatusLabel(null)).toBe("-");
  });
});
