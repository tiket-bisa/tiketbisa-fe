import { describe, expect, it } from "vitest";
import { formatEventTimeRange, mapEventDtoToEntity } from "./event.mapper";

describe("event mapper Jakarta timezone contract", () => {
  it("renders an UTC instant as Jakarta local time", () => {
    expect(formatEventTimeRange(
      "2026-08-20T14:00:00Z",
      "2026-08-20T15:00:00Z",
    )).toBe("21.00 - 22.00");
  });

  it("renders the event date in Jakarta even when the instant is previous-day UTC", () => {
    const event = mapEventDtoToEntity({
      id: "event-1",
      brandId: "brand-1",
      name: "Night Match",
      bannerPath: null,
      startDate: "2026-08-20T18:00:00Z",
      endDate: "2026-08-20T19:00:00Z",
      description: null,
      termAndCondition: null,
      venue: null,
      location: null,
      city: "Jakarta",
      status: "ONGOING",
      isPublished: true,
      minPrice: null,
    }, 0);

    expect(event.date).toContain("21 Agu 2026");
  });

  it("carries enriched brand logo metadata into the event domain", () => {
    const event = mapEventDtoToEntity({
      id: "event-2",
      brandId: "brand-2",
      name: "Match Day",
      bannerPath: null,
      startDate: "2026-08-21T12:00:00Z",
      endDate: "2026-08-21T13:00:00Z",
      description: null,
      termAndCondition: null,
      venue: null,
      location: null,
      city: "Jakarta",
      status: "ONGOING",
      isPublished: true,
      minPrice: null,
    }, 0, { name: "Adhyaksa FC", logoUrl: "https://cdn.test/adhyaksa.png" });

    expect(event.brand).toBe("Adhyaksa FC");
    expect(event.brandLogoUrl).toBe("https://cdn.test/adhyaksa.png");
  });
});
