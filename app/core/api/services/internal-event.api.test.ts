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
      transactionType: "COMPLIMENTARY",
    });
    const params = new URLSearchParams(query.slice(1));

    expect(params.get("limit")).toBe("50");
    expect(params.get("offset")).toBe("100");
    expect(params.get("search")).toBe("PKVA");
    expect(params.get("categoryId")).toBe("category-1");
    expect(params.get("status")).toBe("ISSUED");
    expect(params.get("transactionType")).toBe("COMPLIMENTARY");
  });

  it.each(["WAITING_PAYMENT", "WAITING_APPROVAL"])("sends the %s status filter", (status) => {
    const query = buildTicketDashboardQuery({ status });
    expect(new URLSearchParams(query.slice(1)).get("status")).toBe(status);
  });
});

describe("ticket category counts", () => {
  it("keeps sold, checked-out, and reserved apart", () => {
    const summary = normalizeEventTicketCategory({
      id: "c1",
      soldTicket: 40,
      checkedOutTicket: 65,
      reservedTicket: 25,
      remainingTicket: 1935,
      totalTicket: 2000,
    } as never);

    expect(summary.soldTicket).toBe(40);
    expect(summary.checkedOutTicket).toBe(65);
    expect(summary.reservedTicket).toBe(25);
  });

  it("falls back to issuedTicket for checked out, which is its pre-split name", () => {
    const summary = normalizeEventTicketCategory({ id: "c1", issuedTicket: 65 } as never);

    expect(summary.checkedOutTicket).toBe(65);
    expect(summary.reservedTicket).toBe(0);
  });

  it("derives reservations from pending allocations and live locks", () => {
    const summary = normalizeEventTicketCategory({
      id: "c1",
      soldTicket: 40,
      checkedOutTicket: 65,
      lockedTicket: 5,
    } as never);

    expect(summary.reservedTicket).toBe(30);
  });

  it("reports zero rather than NaN when the backend omits the counts", () => {
    const summary = normalizeEventTicketCategory({ id: "c1" } as never);

    expect(summary.checkedOutTicket).toBe(0);
    expect(summary.soldTicket).toBe(0);
    expect(summary.reservedTicket).toBe(0);
  });
});
