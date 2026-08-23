import { describe, expect, it } from "vitest";
import type { PaymentSelection } from "./checkout.types";
import { canProceedWithPayment } from "./checkout.validation";

const validSelection: PaymentSelection = {
  methodId: "qris",
  agreedToTerms: true,
  agreedToPrivacy: true,
};

describe("canProceedWithPayment", () => {
  it.each([
    ["payment method", { methodId: null }],
    ["terms consent", { agreedToTerms: false }],
    ["privacy consent", { agreedToPrivacy: false }],
  ])("rejects checkout without %s", (_field, override) => {
    expect(canProceedWithPayment({ ...validSelection, ...override })).toBe(false);
  });

  it("accepts checkout after both consents and a payment method are selected", () => {
    expect(canProceedWithPayment(validSelection)).toBe(true);
  });

  it("requires a bank for virtual account payments", () => {
    expect(canProceedWithPayment({ ...validSelection, methodId: "va", bankCode: null })).toBe(false);
    expect(canProceedWithPayment({ ...validSelection, methodId: "va", bankCode: "BCA" })).toBe(true);
  });

  it("does not require a bank when hosted Xendit will collect the bank choice", () => {
    expect(canProceedWithPayment({ ...validSelection, methodId: "va", bankCode: null }, false)).toBe(true);
  });
});
