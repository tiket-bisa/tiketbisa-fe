import { describe, expect, it } from "vitest";
import { buildTicketDashboardQuery, normalizeEventTicketCategory } from "./internal-event.api";

describe("event ticket dashboard query", () => {
  it("sends pagination and server-side filters", () => {
    const query = buildTicketDashboardQuery({
      limit: 50,
      offset: 100,
      search: "PKVA",
      categoryId: "category-1",
      status: "ISSUED",
    });
    const params = new URLSearchParams(query.slice(1));

    expect(params.get("limit")).toBe("50");
    expect(params.get("offset")).toBe("100");
    expect(params.get("search")).toBe("PKVA");
    expect(params.get("categoryId")).toBe("category-1");
    expect(params.get("status")).toBe("ISSUED");
  });
});

describe("ticket category counts", () => {
  it("keeps sold and checked-out apart", () => {
    // Sold is the paid subset and drives revenue; checked out is every claimed seat, which is
    // what the event screen monitors. Collapsing them is the confusion this ticket exists to fix.
    const summary = normalizeEventTicketCategory({
      id: "c1",
      soldTicket: 40,
      checkedOutTicket: 65,
      remainingTicket: 1935,
      totalTicket: 2000,
    } as never);

    expect(summary.soldTicket).toBe(40);
    expect(summary.checkedOutTicket).toBe(65);
  });

  it("falls back to issuedTicket for checked out, which is its pre-split name", () => {
    const summary = normalizeEventTicketCategory({ id: "c1", issuedTicket: 65 } as never);

    expect(summary.checkedOutTicket).toBe(65);
  });

  it("reports zero rather than NaN when the backend omits the counts", () => {
    const summary = normalizeEventTicketCategory({ id: "c1" } as never);

    expect(summary.checkedOutTicket).toBe(0);
    expect(summary.soldTicket).toBe(0);
  });
});
