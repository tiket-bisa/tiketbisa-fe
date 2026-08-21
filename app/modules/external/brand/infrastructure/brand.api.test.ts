import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiFetch = vi.fn();
vi.mock("~/core/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  normalizeImageUrl: (value?: string | null) => value ?? "",
}));

import { brandApi } from "./brand.api";

describe("brandApi", () => {
  beforeEach(() => mockApiFetch.mockReset());

  it("sends official partner category as its own canonical filter", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { limit: 5, offset: 0, totalCount: 0, brands: [] },
    });

    await brandApi.getBrands({ category: "sepak_bola", limit: 5, offset: 0 });

    const url = new URL(String(mockApiFetch.mock.calls[0][0]), "http://localhost");
    expect(url.searchParams.get("category")).toBe("sepak_bola");
    expect(url.searchParams.has("name")).toBe(false);
  });

  it("omits category for the Semua filter", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { limit: 5, offset: 0, totalCount: 0, brands: [] },
    });

    await brandApi.getBrands({ category: "", limit: 5, offset: 0 });

    const url = new URL(String(mockApiFetch.mock.calls[0][0]), "http://localhost");
    expect(url.searchParams.has("category")).toBe(false);
  });
});
