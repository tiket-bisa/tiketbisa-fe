import { describe, expect, it } from "vitest";
import { buildTransactionListQuery, mapTransactionApiToFe, type TransactionApiData } from "./transaction.api";
import { mapTransactionStatusFilterToApi } from "~/core/constants/transaction";

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
    ["WAITING_PAYMENT", "waiting_payment"],
    ["WAITING_APPROVAL", "waiting_approval"],
    ["COMPLETED", "paid"],
    ["PAID", "paid"],
    ["CANCELED", "cancelled"],
    ["CANCELLED", "cancelled"],
  ] as const)("maps backend status %s to %s", (backendStatus, frontendStatus) => {
    expect(mapTransactionApiToFe(transaction(backendStatus)).status).toBe(frontendStatus);
  });

  it("uses transaction creation time as the purchase timestamp", () => {
    const api = transaction("PAID");
    api.created = "2026-08-22T23:00:00Z";
    api.paymentDate = "2026-08-23T00:00:00Z";
    expect(mapTransactionApiToFe(api).created_at).toBe("2026-08-22T23:00:00Z");
  });
});

describe("transaction status filters", () => {
  it("keeps payment and approval queues separate", () => {
    expect(mapTransactionStatusFilterToApi("waiting_payment")).toBe("WAITING_PAYMENT");
    expect(mapTransactionStatusFilterToApi("waiting_approval")).toBe("WAITING_APPROVAL");
  });

  it("uses final backend statuses for paid and cancelled filters", () => {
    expect(mapTransactionStatusFilterToApi("paid")).toBe("COMPLETED");
    expect(mapTransactionStatusFilterToApi("cancelled")).toBe("CANCELED");
  });

  it("sends the requested creation-time sorting to the list endpoint", () => {
    expect(buildTransactionListQuery({ orderBy: "created:ASC" })).toBe("?orderBy=created%3AASC");
    expect(buildTransactionListQuery({ orderBy: "created:DESC" })).toBe("?orderBy=created%3ADESC");
  });

  it("sends the dashboard search as a general transaction search", () => {
    expect(buildTransactionListQuery({ search: "d637649eefa6" })).toBe("?search=d637649eefa6");
  });
});
