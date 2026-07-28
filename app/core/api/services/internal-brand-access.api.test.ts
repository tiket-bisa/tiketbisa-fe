import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteRequest = vi.fn();

vi.mock("../http-client", () => ({
  internalHttpClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: (...args: unknown[]) => deleteRequest(...args),
  },
}));

import { internalBrandAccessApi } from "./internal-brand-access.api";

describe("internalBrandAccessApi.removePartner", () => {
  beforeEach(() => {
    deleteRequest.mockReset();
    deleteRequest.mockResolvedValue({
      success: true,
      data: {
        brandId: "brand-1",
        brandName: "Brand",
        partnerEmails: [],
        internalUsers: [],
      },
    });
  });

  it("uses an encoded email path and does not send a DELETE body", async () => {
    await internalBrandAccessApi.removePartner("brand-1", " Partner+Ops@Example.com ");

    expect(deleteRequest).toHaveBeenCalledWith(
      "/brand/brand-1/access/partner/partner%2Bops%40example.com",
    );
  });
});
