import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventApi } from "../../event/infrastructure/event.api";
import { brandApi } from "../../brand/infrastructure/brand.api";
import { landingApi } from "./landing.api";

vi.mock("../../event/infrastructure/event.api", () => ({
  eventApi: { getEvents: vi.fn() },
}));

vi.mock("../../brand/infrastructure/brand.api", () => ({
  brandApi: { getBrands: vi.fn() },
}));

const eventResponse = (events: unknown[]) => ({
  success: true,
  data: { event_list: events, count: events.length, limit: 8, offset: 0 },
});

describe("landingApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(brandApi.getBrands).mockResolvedValue({
      success: true,
      data: { brand_list: [], count: 0, limit: 5, offset: 0 },
    } as any);
  });

  it("queries upcoming events with real date and price filters", async () => {
    vi.mocked(eventApi.getEvents)
      .mockResolvedValueOnce(eventResponse([{ id: "featured" }]) as any)
      .mockResolvedValueOnce(eventResponse([]) as any);

    await landingApi.getLandingData({
      eventFilters: { time: "this_week", price: "50000-100000", city: "Jakarta", category: "musik" },
    } as any);

    expect(eventApi.getEvents).toHaveBeenNthCalledWith(2, expect.objectContaining({
      status: "ONGOING",
      order_by: "date_asc",
      start_date: expect.any(String),
      end_date: expect.any(String),
      min_price: 50_000,
      max_price: 100_000,
      city: "Jakarta",
      category: "musik",
    }));
  });

  it("falls back to the nearest upcoming event when no curated featured event exists", async () => {
    vi.mocked(eventApi.getEvents)
      .mockResolvedValueOnce(eventResponse([]) as any)
      .mockResolvedValueOnce(eventResponse([]) as any)
      .mockResolvedValueOnce(eventResponse([{ id: "next-event" }]) as any);

    const result = await landingApi.getLandingData({} as any);

    expect(result.featuredEvents).toEqual([{ id: "next-event" }]);
    expect(eventApi.getEvents).toHaveBeenNthCalledWith(3, expect.objectContaining({
      limit: 1,
      status: "ONGOING",
      order_by: "date_asc",
      start_date: expect.any(String),
    }));
  });
});
