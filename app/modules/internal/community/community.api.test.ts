import { beforeEach, describe, expect, it, vi } from "vitest";
const requests = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("~/core/api/http-client", () => ({
  internalHttpClient: requests,
  httpClient: requests,
}));
import { communityApi } from "./community.api";
import { normalizeManualGenerateTicketsResponse } from "~/core/api/services/transaction.api";

describe("community uses the existing internal API flows", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requests.post.mockResolvedValue({
      success: true,
      status_code: 200,
      data: {},
    });
    requests.delete.mockResolvedValue({
      success: true,
      status_code: 200,
      data: {},
    });
  });
  it("submits bulk generation through the shared transaction endpoint", async () => {
    requests.post.mockResolvedValue({
      success: true,
      data: { north: [{ id: "ticket", ticketTransactionId: "tx" }] },
    });
    const result = await communityApi.generate({
      eventId: "match",
      email: "recipient@example.com",
      requestId: "request",
      tickets: [{ categoryId: "north", quantity: 2 }],
    });
    expect(requests.post).toHaveBeenCalledWith("/transaction/manual-generate", {
      eventId: "match",
      customerEmail: "recipient@example.com",
      requestId: "request",
      paymentMethod: "COMPLIMENTARY",
      codeType: "QR_CODE",
      tickets: [{ categoryId: "north", quantity: 2 }],
    });
    expect(result.transactionId).toBe("tx");
  });
  it("uses the existing brand account creation and deactivation endpoints", async () => {
    await communityApi.create({
      brandId: "club",
      username: "fans",
      password: "test-password",
    });
    expect(requests.post).toHaveBeenCalledWith(
      "/brand/club/access/internal-user",
      { username: "fans", password: "test-password", role: "community" },
    );
    await communityApi.deactivate("club", "account");
    expect(requests.delete).toHaveBeenCalledWith(
      "/brand/club/access/internal-user/account",
    );
  });
  it("uses the existing transaction email flow with the original recipient", async () => {
    await communityApi.retryEmail("tx");
    expect(requests.post).toHaveBeenCalledWith(
      "/transaction/detail/tx/tickets/email",
      { deliveryMode: "ORIGINAL_CUSTOMER_EMAIL" },
    );
  });
  it("keeps scanner and community accounts separate in the shared summary", async () => {
    requests.get.mockResolvedValue({
      success: true,
      data: {
        brandId: "club",
        internalUsers: [
          { id: "scanner", username: "gate", role: "scanner", isActive: true },
          {
            id: "community",
            username: "fans",
            role: "community",
            isActive: false,
          },
        ],
      },
    });
    expect(await communityApi.accounts("club")).toEqual([
      { id: "community", username: "fans", brand_id: "club", record_flag: 0 },
    ]);
  });
  it("normalises both ticket batches and legacy transaction-shaped responses", () => {
    expect(
      normalizeManualGenerateTicketsResponse({
        north: [{ id: "ticket", ticket_transaction_id: "tx" }],
      }).id,
    ).toBe("tx");
    expect(normalizeManualGenerateTicketsResponse({ id: "legacy-tx" }).id).toBe(
      "legacy-tx",
    );
  });
});
