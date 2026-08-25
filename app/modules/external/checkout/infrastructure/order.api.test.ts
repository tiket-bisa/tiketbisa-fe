import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "~/core/api";
import type { BuyerInfo, OrderSummary, PaymentMethod } from "../domain/checkout.types";
import { isGatewayPaymentSuccessful, orderApi } from "./order.api";

vi.mock("~/core/api", () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe("orderApi", () => {
  const mockEventId = "e-001";
  const mockSummary: OrderSummary = {
    subtotal: 100000,
    serviceFeePerTicket: 5000,
    serviceFee: 10000,
    transactionFee: 0,
    discount: 0,
    totalPrice: 110000,
    ticketCount: 2,
    items: [{ ticketId: "tc-001", ticketName: "Regular", quantity: 2, price: 50000 }],
  };
  const mockBuyerInfo: BuyerInfo = {
    fullName: "John Doe",
    email: "john@example.com",
    phoneNumber: "08123456789",
    identityType: "KTP",
    identityNumber: "1234567890123456",
  };
  const mockPaymentMethod: PaymentMethod = {
    id: "manual",
    category: "BANK_TRANSFER",
    name: "Manual Transfer",
    logo: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acquireLock sends backend-compatible payload", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {
        userId: "lock-001",
        eventId: mockEventId,
        tickets: [{ categoryId: "tc-001", quantity: 2 }],
        timestamp: Date.now(),
        expiresAt: Date.now() + 900000,
      },
    } as any);

    const result = await orderApi.acquireLock(mockEventId, mockSummary);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/transaction/lock",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          eventId: mockEventId,
          tickets: [{ categoryId: "tc-001", quantity: 2, price: 50000 }],
        }),
      }),
    );
    expect(result.userId).toBe("lock-001");
  });

  it("releaseCheckout explicitly releases an abandoned reservation", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { released: true },
    } as any);

    await orderApi.releaseCheckout("lock-001", mockEventId);

    expect(mockApiFetch).toHaveBeenCalledWith("/transaction/lock/lock-001", {
      method: "DELETE",
      body: JSON.stringify({ eventId: mockEventId }),
    });
  });

  it("storeTempTransaction sends backend-compatible payload without tickets", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { status: "ACTIVE", remaining_seconds: 1800, expires_at: Date.now() + 1_800_000, server_time: Date.now() },
    } as any);

    await orderApi.storeTempTransaction(
      "lock-001",
      mockEventId,
      mockBuyerInfo,
      mockSummary,
      mockPaymentMethod,
    );

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/transaction/temp",
      expect.objectContaining({
        method: "POST",
        headers: {
          "x-tb-identifier": "lock-001",
        },
        body: JSON.stringify({
          userId: "lock-001",
          eventId: mockEventId,
          customerName: "John Doe",
          customerEmail: "john@example.com",
          customerPhone: "+628123456789",
          customerIdentityNumber: "1234567890123456",
          source: "WEBSITE",
          paymentMethod: "MANUAL_TRANSFER",
          isComplimentary: false,
        }),
      }),
    );
  });

  it("executeOrder normalizes issued tickets from complete endpoint", async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          customerName: "John Doe",
          totalPrice: 125000,
          paymentDate: "2026-04-16T02:22:44.000Z",
        },
      } as any)
      .mockResolvedValueOnce({
        success: true,
        data: {
          paymentSessionMode: "COMPONENTS",
          componentsSdkKey: "session-key",
          "tc-001": [
            {
              id: "ticket-1",
              codeHash: "QR-ABC",
              codeType: "QR_CODE",
              ticketCategoryId: "tc-001",
              status: "ISSUED",
            },
          ],
        },
      } as any);

    const result = await orderApi.executeOrder("lock-001");

    expect(mockApiFetch).toHaveBeenNthCalledWith(1, "/transaction/lock-001");
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      2,
      "/transaction/lock-001/complete",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.transactionId).toBe("lock-001");
    expect(result.customerName).toBe("John Doe");
    expect(result.totalPrice).toBe(125000);
    expect(result.paymentSessionMode).toBe("COMPONENTS");
    expect(result.componentsSdkKey).toBe("session-key");
    expect(result.tickets).toEqual([
      {
        ticketId: "ticket-1",
        code: "QR-ABC",
        codeType: "QR_CODE",
        categoryId: "tc-001",
        status: "ISSUED",
      },
    ]);
  });

  describe("isGatewayPaymentSuccessful", () => {
    it("is false for a freshly created invoice (PENDING, tickets awaiting approval)", () => {
      expect(
        isGatewayPaymentSuccessful({
          gatewayStatus: "PENDING",
          tickets: [
            { ticketId: "t1", code: "", codeType: "QR_CODE", categoryId: "tc-001", status: "WAITING_APPROVAL" },
          ],
        }),
      ).toBe(false);
    });

    it("is true once the gateway reports SUCCESSFUL", () => {
      expect(isGatewayPaymentSuccessful({ gatewayStatus: "SUCCESSFUL", tickets: [] })).toBe(true);
    });

    it("is true once tickets are ISSUED even if gatewayStatus is missing", () => {
      expect(
        isGatewayPaymentSuccessful({
          gatewayStatus: null,
          tickets: [
            { ticketId: "t1", code: "QR-1", codeType: "QR_CODE", categoryId: "tc-001", status: "ISSUED" },
          ],
        }),
      ).toBe(true);
    });
  });
});
