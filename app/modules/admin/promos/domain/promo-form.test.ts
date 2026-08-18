import { describe, expect, it } from "vitest";
import { EMPTY_PROMO_FORM, promoFormToPayload, validatePromoForm } from "./promo-form";

describe("promo form", () => {
  it("normalizes a valid payload without database-owned fields", () => {
    const payload = promoFormToPayload({
      ...EMPTY_PROMO_FORM,
      code: " hemat20 ",
      value: "20",
      usedCount: 9,
    });

    expect(payload).toEqual({
      code: "HEMAT20",
      brandId: null,
      type: "PERCENT",
      value: 20,
      maxDiscount: null,
      quota: null,
      startsAt: null,
      endsAt: null,
    });
    expect(payload).not.toHaveProperty("usedCount");
  });

  it.each([
    ["missing code", { code: "", value: "10" }],
    ["percentage above 100", { code: "PROMO", value: "101" }],
    ["non-positive max discount", { code: "PROMO", value: "10", maxDiscount: "0" }],
    ["fractional quota", { code: "PROMO", value: "10", quota: "1.5" }],
    ["quota below usage", { code: "PROMO", value: "10", quota: "4", usedCount: 5 }],
    ["invalid period", { code: "PROMO", value: "10", startsAt: "2026-08-18T12:00", endsAt: "2026-08-18T11:00" }],
  ])("rejects %s", (_name, override) => {
    expect(validatePromoForm({ ...EMPTY_PROMO_FORM, ...override })).toBeTruthy();
  });

  it("accepts a valid promo", () => {
    expect(validatePromoForm({ ...EMPTY_PROMO_FORM, code: "PROMO", value: "10", quota: "10" })).toBeNull();
  });
});
