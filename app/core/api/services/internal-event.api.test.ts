import { describe, expect, it } from "vitest";
import { buildTicketDashboardQuery } from "./internal-event.api";

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
