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
    vi.useRealTimers();
  });

  it("keeps an in-progress event visible until its end time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T08:30:00Z"));
    mockApiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          limit: 12,
          offset: 0,
          totalCount: 2,
          events: [
            {
              id: "in-progress",
              brandId: "brand-123",
              name: "In Progress",
              startDate: "2026-09-05T08:00:00Z",
              endDate: "2026-09-05T11:00:00Z",
              status: "ONGOING",
            },
            {
              id: "finished",
              brandId: "brand-123",
              name: "Finished",
              startDate: "2026-09-05T07:00:00Z",
              endDate: "2026-09-05T08:29:59Z",
              status: "ONGOING",
            },
          ],
        },
      })
      .mockResolvedValueOnce({ success: true, data: { brands: [] } });

    const result = await eventApi.getEvents({ limit: 12, offset: 0, status: "ONGOING" });
    const events = result.data.event_list as Array<{ id: string; endDate?: string }>;

    expect(events.map((event) => event.id)).toEqual(["in-progress"]);
    expect(events[0].endDate).toBe("2026-09-05T11:00:00Z");
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
        data: { brands: [{ id: "brand-123", name: "Test 123", logoPath: "https://cdn.test/logo.png" }] },
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
    expect((result.data.event_list as Array<{ brandLogoUrl: string }>)[0].brandLogoUrl)
      .toBe("https://cdn.test/logo.png");
  });

  it("enriches event detail with the brand logo", async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: "event-1",
          brandId: "brand-123",
          name: "Event Test",
          bannerPath: null,
          startDate: "2026-07-30T10:00:00Z",
          endDate: "2026-07-30T11:00:00Z",
          description: null,
          city: "Jakarta",
          status: "ONGOING",
          isPublished: true,
        },
      })
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: { images: [] } })
      .mockResolvedValueOnce({
        success: true,
        data: { id: "brand-123", name: "Test 123", logoPath: "https://cdn.test/detail-logo.png" },
      });

    const event = await eventApi.getEventById("event-1");

    expect(event?.brand).toBe("Test 123");
    expect(event?.brandLogoUrl).toBe("https://cdn.test/detail-logo.png");
  });
});
