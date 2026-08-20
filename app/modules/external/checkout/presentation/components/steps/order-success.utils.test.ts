import { describe, expect, it } from "vitest";
import { getTicketCategoryName } from "./order-success.utils";

describe("getTicketCategoryName", () => {
  const categories = [
    { id: "regular", name: "Regular", price: 50_000, available: true },
    { id: "vip", name: "VIP", price: 100_000, available: true },
  ];

  it("resolves the real category name", () => {
    expect(getTicketCategoryName(categories, "vip")).toBe("VIP");
  });

  it("uses a neutral fallback for missing categories", () => {
    expect(getTicketCategoryName(categories, "unknown")).toBe("Kategori tidak tersedia");
  });
});
