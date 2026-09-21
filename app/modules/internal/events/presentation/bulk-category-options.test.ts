import { describe, expect, it } from "vitest";

import { buildBulkCategoryOptions } from "./bulk-category-options";

const category = (overrides: Partial<Parameters<typeof buildBulkCategoryOptions>[0][number]> = {}) => ({
  id: "c1",
  name: "Tribun Barat A (Komplimen)",
  price: 0,
  available: 5,
  ...overrides,
});

describe("buildBulkCategoryOptions", () => {
  it("offers a category that still has stock", () => {
    const [option] = buildBulkCategoryOptions([category()]);

    expect(option.disabled).toBe(false);
    expect(option.label).toContain("sisa 5");
  });

  it("lists an exhausted category but refuses to let it be chosen", () => {
    // Visible on purpose: the category exists and is simply out of stock, which is worth seeing.
    const [option] = buildBulkCategoryOptions([category({ available: 0 })]);

    expect(option.disabled).toBe(true);
    expect(option.label).toContain("habis");
    expect(option.label).not.toContain("sisa");
  });

  it("treats a negative remainder as exhausted rather than offering it", () => {
    // issued can exceed the quota after a counter drifts; "sisa -3" must not read as available.
    const [option] = buildBulkCategoryOptions([category({ available: -3 })]);

    expect(option.disabled).toBe(true);
    expect(option.label).toContain("habis");
  });
});
