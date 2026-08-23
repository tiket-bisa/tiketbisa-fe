import { describe, expect, it } from "vitest";
import { mapTransactionApiToFe, type TransactionApiData } from "./transaction.api";

function transaction(status: string): TransactionApiData {
  return {
    id: "tx-1",
    customerName: "Buyer",
    customerEmail: "buyer@example.com",
    customerPhone: "08123456789",
    totalPrice: 10000,
    status,
    paymentMethod: "VA",
    paymentDate: "2026-08-23T00:00:00Z",
    created: "2026-08-23T00:00:00Z",
  };
}

describe("mapTransactionApiToFe", () => {
  it.each([
    ["EXPIRED", "expired"],
    ["WAITING_PAYMENT", "pending"],
    ["WAITING_APPROVAL", "pending"],
    ["COMPLETED", "paid"],
    ["PAID", "paid"],
    ["CANCELED", "cancelled"],
    ["CANCELLED", "cancelled"],
  ] as const)("maps backend status %s to %s", (backendStatus, frontendStatus) => {
    expect(mapTransactionApiToFe(transaction(backendStatus)).status).toBe(frontendStatus);
  });
});
