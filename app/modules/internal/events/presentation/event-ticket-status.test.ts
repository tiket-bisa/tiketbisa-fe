import { describe, expect, it } from "vitest";
import { getEventTransactionStatusLabel } from "./event-ticket-status";

describe("event ticket status", () => {
  it("labels a VA transaction waiting for payment", () => {
    expect(getEventTransactionStatusLabel("WAITING_PAYMENT")).toBe("Menunggu Pembayaran");
  });

  it("keeps manual transfer approval separate from payment", () => {
    expect(getEventTransactionStatusLabel("WAITING_APPROVAL")).toBe("Menunggu Approval");
  });

  it("keeps issued tickets issued and labels completed payment", () => {
    expect(getEventTransactionStatusLabel("COMPLETED")).toBe("Lunas");
    expect(getEventTransactionStatusLabel(null)).toBe("-");
  });
});
