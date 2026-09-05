import { describe, expect, it } from "vitest";
import { isValidDotComEmail, isValidNik } from "./form-validation";

describe("form validation", () => {
  it("requires a syntactically valid .com email", () => {
    expect(isValidDotComEmail("buyer@example.com")).toBe(true);
    expect(isValidDotComEmail(" BUYER@EXAMPLE.COM ")).toBe(true);
    expect(isValidDotComEmail("buyer@example.id")).toBe(false);
    expect(isValidDotComEmail("buyer.example.com")).toBe(false);
  });

  it("requires NIK to contain exactly 16 digits", () => {
    expect(isValidNik("1234567890123456")).toBe(true);
    expect(isValidNik("123456789012345")).toBe(false);
    expect(isValidNik("123456789012345a")).toBe(false);
  });
});
