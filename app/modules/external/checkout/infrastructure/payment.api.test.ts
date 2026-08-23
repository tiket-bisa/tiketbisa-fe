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
      paymentSessionEnabled: false,
      paymentMethods: [],
    });
    expect(mockApiFetch).toHaveBeenCalledWith("/transaction/payment-config");
  });

  it("fails closed when configuration cannot be loaded", async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, data: null } as any);
    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] });
  });

  it("maps hosted methods without requiring a local VA bank choice", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {
        paymentSessionEnabled: true,
        virtualAccountBanks: [],
        paymentMethods: [{ id: "va", name: "Virtual Account", category: "BANK_TRANSFER", paymentMethod: "VA", feeType: "FLAT", feeValue: 5000 }],
      },
    } as any);
    const result = await paymentApi.getConfiguration();
    expect(result.paymentSessionEnabled).toBe(true);
    expect(result.paymentMethods[0]).toMatchObject({ id: "va", requiresBankSelection: false, feeValue: 5000 });
  });

  it("fails closed when the configuration request throws", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("network unavailable"));
    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] });
  });
});
