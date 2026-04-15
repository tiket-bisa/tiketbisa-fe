import { describe, it, expect, vi, beforeEach } from "vitest";
import { orderApi } from "./order.api";
import { apiFetch } from "~/core/api";

// Mocking apiFetch to control backend responses
vi.mock("~/core/api", () => ({
  apiFetch: vi.fn(),
}));

describe("Order API Integration (DDD/SOLID Tests)", () => {
  const mockEventId = "event-123";
  const mockSummary = {
    items: [{ id: "cat-1", quantity: 2, price: 50000 }],
    totalPrice: 100000,
  };
  const mockBuyerInfo = {
    fullName: "John Doe",
    email: "john@example.com",
    phoneNumber: "08123456789",
  };
  const mockPaymentMethod = {
    id: "manual",
    category: "BANK_TRANSFER",
    name: "Manual Transfer",
    logo: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Phase 1: Acquire Lock", () => {
    it("should call Phase 1 endpoint with correct DTO structure", async () => {
      (apiFetch as any).mockResolvedValueOnce({
        success: true,
        data: { userId: "lock-001", expiresAt: Date.now() + 900000 },
      });

      const result = await orderApi.acquireLock(mockEventId, mockSummary);

      expect(apiFetch).toHaveBeenCalledWith("/transaction", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"eventId":"event-123"'),
      }));
      expect(result.userId).toBe("lock-001");
    });

    it("should throw error if backend fails to lock", async () => {
      (apiFetch as any).mockResolvedValueOnce({
        success: false,
        message: "Tickets sold out",
      });

      await expect(orderApi.acquireLock(mockEventId, mockSummary))
        .rejects.toThrow("Tickets sold out");
    });
  });

  describe("Phase 2: Store Temp Transaction", () => {
    it("should attach customer info to existing lockId", async () => {
      (apiFetch as any).mockResolvedValueOnce({ success: true });

      await orderApi.storeTempTransaction(
        "lock-001",
        mockEventId,
        mockBuyerInfo,
        mockSummary,
        mockPaymentMethod
      );

      expect(apiFetch).toHaveBeenCalledWith("/transaction/temp/lock-001", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"customerName":"John Doe"'),
      }));
    });
  });

  describe("Phase 3: Execute Order", () => {
    it("should finalize transaction and return complete order info", async () => {
      const mockFinalResponse = {
        transactionId: "tx-999",
        customerName: "John Doe",
        tickets: [{ ticketId: "t-1", code: "QR-123" }],
      };

      (apiFetch as any).mockResolvedValueOnce({
        success: true,
        data: mockFinalResponse,
      });

      const result = await orderApi.executeOrder("lock-001");

      expect(apiFetch).toHaveBeenCalledWith("/transaction/lock-001/complete", expect.objectContaining({
        method: "POST",
      }));
      expect(result.transactionId).toBe("tx-999");
    });
  });
});
