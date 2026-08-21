import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "~/core/api";
import { paymentApi } from "./payment.api";

vi.mock("~/core/api", () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

describe("paymentApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only backend-configured VA banks", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { virtualAccountBanks: [{ code: "BRI", name: "BRI" }] },
    } as any);

    await expect(paymentApi.getConfiguration()).resolves.toEqual({
      virtualAccountBanks: [{ code: "BRI", name: "BRI" }],
    });
    expect(mockApiFetch).toHaveBeenCalledWith("/transaction/payment-config");
  });

  it("fails closed when configuration cannot be loaded", async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, data: null } as any);
    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [] });
  });

  it("fails closed when the configuration request throws", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("network unavailable"));
    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [] });
  });
});
