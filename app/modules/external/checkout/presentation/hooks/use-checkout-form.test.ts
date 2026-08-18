// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getFirstInvalidFieldId, useCheckoutForm } from "./use-checkout-form";

describe("getFirstInvalidFieldId", () => {
  it("prioritizes buyer fields in visual order", () => {
    expect(getFirstInvalidFieldId(
      { email: "Invalid", phoneNumber: "Required" },
      [{ name: "Required" }],
    )).toBe("email");
  });

  it("then prioritizes each ticket holder in visual order", () => {
    expect(getFirstInvalidFieldId(
      {},
      [{}, { identityNumber: "Required" }, { name: "Required" }],
    )).toBe("holder-1-identityNumber");
  });

  it("returns null when no fields are invalid", () => {
    expect(getFirstInvalidFieldId({}, [])).toBeNull();
  });

  it("validates every selected ticket before holder state has been sized", () => {
    const { result } = renderHook(() => useCheckoutForm());

    const validation = result.current.validate(2);

    // Four empty buyer fields plus name and NIK for each of the two selected tickets.
    expect(validation.errorCount).toBe(8);
  });
});
