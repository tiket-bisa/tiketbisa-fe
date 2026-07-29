import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiFetch = vi.fn();

vi.mock("~/core/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  normalizeImageUrl: (value?: string | null) => value ?? "",
}));

import { eventApi } from "./event.api";

describe("eventApi.getEvents", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("forwards brand, status, filters, pagination, and normalized sorting", async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          limit: 12,
          offset: 0,
          totalCount: 1,
          events: [{
            id: "event-1",
            brandId: "brand-123",
            name: "Event Test",
            startDate: "2026-07-30T10:00:00Z",
            city: "Palangka Raya",
            minPrice: 50_000,
          }],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { brands: [{ id: "brand-123", name: "Test 123" }] },
      });

    const result = await eventApi.getEvents({
      limit: 12,
      offset: 0,
      brand_id: "brand-123",
      status: "ENDED",
      city: "Palangka Raya",
      category: "sepak_bola",
      min_price: 50_000,
      max_price: 100_000,
      order_by: "date_desc",
    });

    const eventRequestUrl = String(mockApiFetch.mock.calls[0][0]);
    const query = new URL(eventRequestUrl, "http://localhost").searchParams;
    expect(query.get("brandId")).toBe("brand-123");
    expect(query.get("status")).toBe("ENDED");
    expect(query.get("city")).toBe("Palangka Raya");
    expect(query.get("category")).toBe("sepak_bola");
    expect(query.get("minPrice")).toBe("50000");
    expect(query.get("maxPrice")).toBe("100000");
    expect(query.get("sortBy")).toBe("start_date:DESC");
    expect((result.data.event_list as Array<{ brand: string }>)[0].brand).toBe("Test 123");
  });
});
